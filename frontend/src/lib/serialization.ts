import {
    Buffer
} from "buffer";

/**
 * turn string into 32bytes 
 * use for something like username publickey
 */
export function encodeString32(str: string): Uint8Array {
    const buf = Buffer.alloc(32);
    const encoded = new TextEncoder().encode(str);
    buf.set(encoded.slice(0, 32), 0);
    return new Uint8Array(buf);
}

/**
 * turn  unsigned bigint into 8bytes 
 * use for something like price
 */
export function encodeU64LE(num: bigint | number): Uint8Array {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(BigInt(num), 0);
    return new Uint8Array(buf);
}

/**
 * turn bigint into 8bytes
 *  use for expires_at
 */
export function encodeI64LE(num: bigint | number): Uint8Array {
    const buf = Buffer.alloc(8);
    buf.writeBigInt64LE(BigInt(num), 0);
    return new Uint8Array(buf);
}

/** 
 *  turn the Hex Hash into Uint8Array 
 */

export function hexToUint8Array(hexString: string): Uint8Array {
    return new Uint8Array(Buffer.from(hexString, 'hex'));
}