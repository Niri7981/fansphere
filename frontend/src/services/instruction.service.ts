import { FANSPHERE_PROGRAM_ID } from "@/config/constants";
import { deriveProfilePDA } from "@/lib/pda";
import { encodeString32, encodeU64LE, hexToUint8Array } from "@/lib/serialization";
import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";




/**
 * Builds the raw instruction for 0x00: CreateProfile
 * * 📦 Data Memory Layout (73 bytes total):
 * [0]      : 0x00 (Discriminator)
 * [1..33]  : username (32 bytes, UTF-8 string padded with zeros)
 * [33..65] : avatar_hash (32 bytes, compressed from 64-char Arweave Hex)
 * [65..73] : subscription_price (8 bytes, Little Endian u64, in lamports)
 * * 👥 Accounts Expected by Backend:
 * 0. creator           (Signer, Writable) - Pays for rent and signs tx
 * 1. subscriber_mint   (Readonly)         - NFT Mint address for future subscribers
 * 2. profile_state     (Writable)         - The PDA to be initialized
 * 3. system_program    (Readonly)         - Required for account allocation
 * * @param creator - The public key of the creator (wallet connected)
 * @param subscriberMint - The NFT Mint address associated with this creator
 * @param username - The creator's display name
 * @param avatarHash - The 64-character Arweave transaction hash for the avatar
 * @param subscriptionPrice - Monthly subscription fee in lamports
 * @returns A raw TransactionInstruction ready to be sent to the network
 */

export function buildCreateProfileInstruction(
    creator: PublicKey,
    subscriberMint: PublicKey,
    username: string,
    avatarHash: string,
    subscriptionPrice: bigint
): TransactionInstruction {

    // ==========================================
    // 1. Serialize Data Buffer (73 bytes)
    // ==========================================
    const data = Buffer.alloc(73);

    data.writeUInt8(0x00, 0);

    data.set(encodeString32(username), 1);

    data.set(hexToUint8Array(avatarHash), 33);

    data.set(encodeU64LE(subscriptionPrice), 65);

    // ==========================================
    // 2. Map Accounts (Keys)
    // ==========================================


    const [profilePda] = deriveProfilePDA(creator);

    const keys = [
        { pubkey: creator, isSigner: true, isWritable: true, },
        { pubkey: subscriberMint, isSigner: false, isWritable: false },
        { pubkey: profilePda, isSigner: false, isWritable: true, },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false, },
    ];

    // ==========================================
    // 3. Assemble and Return
    // ==========================================


    return new TransactionInstruction({
        programId: FANSPHERE_PROGRAM_ID,
        keys,
        data,
    });
}