// Tiny stack VM, ISA v1. Node 22, stdlib only. Deterministic: no clock, no randomness.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const IN = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUT = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

class Trap extends Error {
  code: number;
  constructor(code: number) {
    super('trap ' + code);
    this.code = code;
  }
}
const trap = (c: number): never => {
  throw new Trap(c);
};

function run(prog: Buffer, input: Buffer): { out: Buffer; exit: number } {
  const st: number[] = []; // data stack, signed 32-bit ints, at most 256
  const cs: number[] = []; // call stack of return addresses, at most 64
  const mem = new Int32Array(256);
  const out: number[] = [];
  let pc = 0;
  let ip = 0;
  let steps = 0;
  const need = (n: number) => {
    if (st.length < n) trap(2);
  };
  const push = (v: number) => {
    if (st.length >= 256) trap(3);
    st.push(v | 0);
  };
  const pop = () => st.pop() as number;
  const put = (b: number) => {
    if (out.length + 1 > 65536) trap(11);
    out.push(b & 255);
  };
  const s16 = (at: number) => {
    const o = prog[at] | (prog[at + 1] << 8);
    return o >= 0x8000 ? o - 0x10000 : o;
  };
  try {
    for (;;) {
      if (steps >= 1000000) trap(10);
      if (pc < 0 || pc >= prog.length) trap(9);
      const op = prog[pc];
      const imm = (n: number) => {
        if (pc + 1 + n > prog.length) trap(9);
      };
      let next = pc + 1;
      steps++;
      switch (op) {
        case 0x00: // HALT
          return { out: Buffer.from(out), exit: 0 };
        case 0x01: // PUSH8, sign-extended
          imm(1);
          push((prog[pc + 1] << 24) >> 24);
          next = pc + 2;
          break;
        case 0x02: // PUSH32, little-endian signed
          imm(4);
          push(prog[pc + 1] | (prog[pc + 2] << 8) | (prog[pc + 3] << 16) | (prog[pc + 4] << 24));
          next = pc + 5;
          break;
        case 0x03: // POP
          need(1);
          pop();
          break;
        case 0x04: // DUP
          need(1);
          push(st[st.length - 1]);
          break;
        case 0x05: // SWAP ( a b -- b a )
          need(2);
          {
            const a = pop();
            const b = pop();
            push(a);
            push(b);
          }
          break;
        case 0x06: // OVER ( a b -- a b a )
          need(2);
          push(st[st.length - 2]);
          break;
        case 0x07: // ROT ( a b c -- b c a )
          need(3);
          {
            const c = pop();
            const b = pop();
            const a = pop();
            push(b);
            push(c);
            push(a);
          }
          break;
        case 0x30: // JMP, signed 16-bit offset from next instruction
          imm(2);
          next = pc + 3 + s16(pc + 1);
          break;
        case 0x31: // JZ
          imm(2);
          need(1);
          next = pop() === 0 ? pc + 3 + s16(pc + 1) : pc + 3;
          break;
        case 0x32: // JNZ
          imm(2);
          need(1);
          next = pop() !== 0 ? pc + 3 + s16(pc + 1) : pc + 3;
          break;
        case 0x33: // CALL, unsigned 16-bit target
          imm(2);
          if (cs.length >= 64) trap(7);
          cs.push(pc + 3);
          next = prog[pc + 1] | (prog[pc + 2] << 8);
          break;
        case 0x34: // RET
          if (cs.length === 0) trap(8);
          next = cs.pop() as number;
          break;
        case 0x10: // ADD, wraps
          need(2);
          {
            const b = pop();
            const a = pop();
            push((a + b) | 0);
          }
          break;
        case 0x11: // SUB, wraps
          need(2);
          {
            const b = pop();
            const a = pop();
            push((a - b) | 0);
          }
          break;
        case 0x12: // MUL, low 32 bits of the exact product
          need(2);
          {
            const b = pop();
            const a = pop();
            push(Math.imul(a, b));
          }
          break;
        case 0x13: // DIV, signed, truncated toward zero
          need(2);
          {
            const b = pop();
            const a = pop();
            if (b === 0) trap(4);
            push((a / b) | 0);
          }
          break;
        case 0x14: // MOD, signed remainder, sign of a
          need(2);
          {
            const b = pop();
            const a = pop();
            if (b === 0) trap(4);
            push((a % b) | 0);
          }
          break;
        case 0x15: // DIVU, unsigned quotient read back signed
          need(2);
          {
            const b = pop();
            const a = pop();
            if (b === 0) trap(4);
            push(Math.floor((a >>> 0) / (b >>> 0)) | 0);
          }
          break;
        case 0x16: // MODU, unsigned remainder read back signed
          need(2);
          {
            const b = pop();
            const a = pop();
            if (b === 0) trap(4);
            push(((a >>> 0) % (b >>> 0)) | 0);
          }
          break;
        case 0x17: // NEG, wraps
          need(1);
          push(-pop() | 0);
          break;
        case 0x18: // AND
          need(2);
          {
            const b = pop();
            const a = pop();
            push(a & b);
          }
          break;
        case 0x19: // OR
          need(2);
          {
            const b = pop();
            const a = pop();
            push(a | b);
          }
          break;
        case 0x1a: // XOR
          need(2);
          {
            const b = pop();
            const a = pop();
            push(a ^ b);
          }
          break;
        case 0x1b: // NOT
          need(1);
          push(~pop());
          break;
        case 0x1c: // SHL, count masked to low 5 bits
          need(2);
          {
            const b = pop();
            const a = pop();
            push(a << (b & 31));
          }
          break;
        case 0x1d: // SHR, arithmetic
          need(2);
          {
            const b = pop();
            const a = pop();
            push(a >> (b & 31));
          }
          break;
        case 0x1e: // SHRU, logical, read back signed
          need(2);
          {
            const b = pop();
            const a = pop();
            push(a >>> (b & 31));
          }
          break;
        case 0x20: // EQ
          need(2);
          {
            const b = pop();
            const a = pop();
            push(a === b ? 1 : 0);
          }
          break;
        case 0x21: // LT, signed
          need(2);
          {
            const b = pop();
            const a = pop();
            push(a < b ? 1 : 0);
          }
          break;
        case 0x22: // LTU, unsigned
          need(2);
          {
            const b = pop();
            const a = pop();
            push((a >>> 0) < (b >>> 0) ? 1 : 0);
          }
          break;
        case 0x40: // LOAD ( addr -- v )
          need(1);
          {
            const a = pop();
            if (a < 0 || a > 255) trap(6);
            push(mem[a]);
          }
          break;
        case 0x41: // STORE ( v addr -- )
          need(2);
          {
            const a = pop();
            const v = pop();
            if (a < 0 || a > 255) trap(6);
            mem[a] = v;
          }
          break;
        case 0x50: // PRINT, decimal ASCII, no sign except leading '-'
          need(1);
          {
            const s = String(pop());
            if (out.length + s.length > 65536) trap(11);
            for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
          }
          break;
        case 0x51: // PUTC, one byte
          need(1);
          put(pop());
          break;
        case 0x52: // IN, next input byte or -1 when used up
          push(ip < input.length ? input[ip++] : -1);
          break;
        case 0x53: // EXIT, low byte of v
          need(1);
          return { out: Buffer.from(out), exit: pop() & 255 };
        default:
          trap(5);
      }
      pc = next;
    }
  } catch (e) {
    if (e instanceof Trap) return { out: Buffer.from(out), exit: e.code };
    throw e;
  }
}

for (const id of readdirSync(IN).sort()) {
  const prog = readFileSync(join(IN, id, 'program.bin'));
  const input = readFileSync(join(IN, id, 'input.bin'));
  const { out, exit } = run(prog, input);
  mkdirSync(join(OUT, id), { recursive: true });
  writeFileSync(join(OUT, id, 'stdout.bin'), out);
  writeFileSync(join(OUT, id, 'exit.txt'), exit + '\n');
}
