import { FANSPHERE_PROGRAM_ID } from "@/config/constants";
import { derivePostPDA, deriveProfilePDA } from "@/lib/pda";
import { encodeString32, encodeU32LE, encodeU64LE, hexToUint8Array } from "@/lib/serialization";
import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { isWritable } from "stream";




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

/**
 * Builds the raw instruction for 0x01: CreatePost (CreateVault)
 * * 📦 Data Memory Layout (114 bytes total):
 * [0]       : 0x01 (Discriminator)
 * [1..9]    : seed (8 bytes, Little Endian u64)
 * [9..17]   : price (8 bytes, Little Endian u64, in lamports)
 * [17..49]  : content_hash (32 bytes, compressed from 64-char Hex)
 * [49]      : is_private (1 byte, 0 = public, 1 = subscriber-only)
 * [50..82]  : title (32 bytes, UTF-8 string padded with zeros)
 * [82..114] : preview_hash (32 bytes, compressed from 64-char Hex)
 * * 👥 Accounts Expected by Backend:
 * 0. maker             (Signer, Writable) - Creator paying for the post PDA rent
 * 1. post_state        (Writable)         - The Post PDA to be initialized
 * 2. mint              (Readonly)         - Token Mint address (for future tokenomics)
 * 3. system_program    (Readonly)         - Required for memory allocation
 * * @param maker - The creator's public key
 * @param mint - The token mint public key
 * @param seed - Unique identifier for the post PDA
 * @param price - Post price in lamports
 * @param contentHash - Arweave Hash for the real media (64 chars hex)
 * @param isPrivate - True if locked behind paywall
 * @param title - Post title (max 32 bytes)
 * @param previewHash - Arweave Hash for the blurred preview (64 chars hex)
 */

export function buildCreatePostInstruction(
    seed: bigint,
    price: bigint,
    content_hash: string,
    is_private: boolean,
    title: string,
    preview_hash: string,
    maker: PublicKey,
    mint: PublicKey,
): TransactionInstruction {

    // ==========================================
    // 1. Serialize Data Buffer (114 bytes)
    // ==========================================

    const data = Buffer.alloc(114);

    data.writeUInt8(0x01, 0);

    data.set(encodeU64LE(seed), 1);

    data.set(encodeU64LE(price), 9);

    data.set(hexToUint8Array(content_hash), 17);

    data.writeUInt8(is_private ? 1 : 0, 49);

    data.set(encodeString32(title), 50);

    data.set(hexToUint8Array(preview_hash), 82);

    // ==========================================
    // 2. Map Accounts (Keys) - STRICT ORDER
    // ==========================================


    const [postPda] = derivePostPDA(maker, seed);

    const keys = [
        { pubkey: maker, isSigner: true, isWritable: true },
        { pubkey: postPda, isSigner: false, isWritable: true, },
        { pubkey: mint, isSigner: false, isWritable: false },
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
