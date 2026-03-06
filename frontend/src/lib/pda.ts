import { PublicKey } from '@solana/web3.js';
import {
    FANSPHERE_PROGRAM_ID,
    SEED_PROFILE,
    SEED_POST,
    SEED_SUBSCRIPTION,
    SEED_LIKE
} from '../config/constants';

import { encodeU64LE } from './serialization';
import { encode } from 'punycode';
/**
 * 
 */
export function deriveProfilePDA(creatorPubkey: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [SEED_PROFILE, creatorPubkey.toBuffer()],
        FANSPHERE_PROGRAM_ID
    );
}

export function derivePostPDA(makerPubkey: PublicKey, seed: bigint): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [
            SEED_POST,
            makerPubkey.toBuffer(),
            encodeU64LE(seed),
        ],
        FANSPHERE_PROGRAM_ID
    );
}

export function deriveSubscriptionPDA(
    creatorPubkey: PublicKey,
    subscriberPubkey: PublicKey,
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [SEED_SUBSCRIPTION, creatorPubkey.toBuffer(), subscriberPubkey.toBuffer()],
        FANSPHERE_PROGRAM_ID
    );
}

export function deriveLikePDA(targetPda: PublicKey, userPubkey: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [SEED_LIKE, targetPda.toBuffer(), userPubkey.toBuffer()],
        FANSPHERE_PROGRAM_ID
    );
}