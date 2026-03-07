import { FANSPHERE_PROGRAM_ID } from "@/config/constants";
import { deriveCommentPDA, deriveLikePDA, derivePostPDA, deriveProfilePDA, deriveSubscriptionPDA } from "@/lib/pda";
import { encodeI64LE, encodeString32, encodeU32LE, encodeU64LE, hexToUint8Array } from "@/lib/serialization";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
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

/**
 * Builds the raw instruction for 0x02: LikePost
 * * 📦 Data Memory Layout (1 byte total):
 * [0]      : 0x02 (Discriminator)
 * * 👥 Accounts Expected by Backend:
 * 0. user              (Signer, Writable) - The user liking the post
 * 1. post_state        (Writable)         - Post PDA (likes counter will be incremented)
 * 2. like_record       (Writable)         - LikeRecord PDA (prevents double liking)
 * 3. system_program    (Readonly)         - Required for allocating like_record PDA
 * * @param user - The public key of the user liking the post
 * @param postPda - The PDA of the post being liked
 * @returns TransactionInstruction
 */

export function createLikePostInstruction(
    user: PublicKey,
    post_PDA: PublicKey,

): TransactionInstruction {

    const data = Buffer.alloc(1);//0x02

    data.writeUInt8(0x02, 0);

    const [likepostPda] = deriveLikePDA(post_PDA, user);

    const keys = [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: post_PDA, isSigner: false, isWritable: true, },
        { pubkey: likepostPda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false, },
    ];

    return new TransactionInstruction({
        programId: FANSPHERE_PROGRAM_ID,
        keys,
        data,
    });
}

/**
 * Builds the raw instruction for 0x03: CreateComment
 * * 📦 Data Memory Layout (38 bytes total):
 * [0]      : 0x03 (Discriminator)
 * [1..5]   : comment_index (4 bytes, Little Endian u32)
 * [5..37]  : content_hash (32 bytes, compressed from 64-char Hex)
 * [37]     : depth (1 byte, 0 = root comment, 1 = reply)
 * * 👥 Accounts Expected by Backend:
 * 0. author              (Signer, Writable) - The user commenting
 * 1. post_state          (Writable)         - The Post PDA being commented on
 * 2. comment_state       (Writable)         - The Comment PDA to be initialized
 * 3. parent              (Readonly/Writable)- Root: SystemProgram, Reply: Parent Comment PDA
 * 4. subscription_record (Readonly)         - Verifies if the user is a subscriber (if required)
 * 5. system_program      (Readonly)         - Required for memory allocation
 * * @param comment_index - The sequential index of this comment under the post
 * @param content_hash - Arweave Hash for the comment text (64 chars hex)
 * @param depth - 0 for direct post comments, 1 for nested replies
 * @param author - The commenter's public key
 * @param post_state - The post's PDA
 * @param parent - The parent comment PDA (or SystemProgram if depth is 0)
 * @param subscription_record - The subscription record PDA of the commenter
 * @returns TransactionInstruction
 */

export function createCommentInstruction(
    comment_index: number, //the location of current comment under the root node
    content_hash: string,
    depth: number,
    author: PublicKey,
    post_state: PublicKey,
    parent: PublicKey,
    subscription_record: PublicKey,
): TransactionInstruction {
    const data = Buffer.alloc(38);

    data.writeUInt8(0x03, 0);

    data.set(encodeU32LE(comment_index), 1);

    data.set(hexToUint8Array(content_hash), 5);

    data.writeUInt8(depth, 37);

    const [commentPda] = deriveCommentPDA(parent, comment_index,);

    const keys = [
        { pubkey: author, isSigner: true, isWritable: true },
        { pubkey: post_state, isSigner: false, isWritable: true, },
        { pubkey: commentPda, isSigner: false, isWritable: true },
        { pubkey: parent, isSigner: false, isWritable: false },
        { pubkey: subscription_record, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false, },
    ];

    return new TransactionInstruction({
        programId: FANSPHERE_PROGRAM_ID,
        keys,
        data,
    });
}

/**
 * Builds the raw instruction for 0x04: Subscribe
 * * 📦 Data Memory Layout (9 bytes total):
 * [0]      : 0x04 (Discriminator)
 * [1..9]   : expires_at (8 bytes, Little Endian i64 timestamp)
 * * 👥 Accounts Expected by Backend (CRITICAL ORDER):
 * 0. subscriber                (Signer, Writable) - Pays the subscription fee
 * 1. creator_profile           (Writable)         - Creator's Profile PDA (to update metrics)
 * 2. subscriber_token_account  (Writable)         - Subscriber's USDC ATA (to deduct funds)
 * 3. creator_token_account     (Writable)         - Creator's USDC ATA (to receive funds)
 * 4. subscribe_pda             (Writable)         - Subscription Record PDA to be initialized
 * 5. subscriber_nft_account    (Writable)         - Subscriber's NFT ATA (to receive badge)
 * 6. subscriber_mint           (Writable)         - The Creator's NFT Mint
 * 7. token_program             (Readonly)         - SPL Token Program ID
 * 8. system_program            (Readonly)         - Required for PDA allocation
 * * @param expires_at - Unix timestamp (i64) when the subscription ends
 * @param creator - The public key of the creator
 * @param subscriber - The public key of the fan subscribing
 * @param creator_profile - The creator's profile PDA
 * @param subscriber_token_account - Fan's associated token account (USDC)
 * @param creator_token_account - Creator's associated token account (USDC)
 * @param subscriber_nft_account - Fan's associated token account (NFT)
 * @param subscriber_mint - The NFT mint address of the creator
 * @returns TransactionInstruction
 */

export function createSubscription(
    expires_at: bigint,
    creator: PublicKey,
    subscriber: PublicKey,
    creator_profile: PublicKey,
    subscriber_token_account: PublicKey,
    creator_token_account: PublicKey,
    subscription_record: PublicKey,
    subscriber_nft_account: PublicKey,
    subscriber_mint: PublicKey,
): TransactionInstruction {

    const data = Buffer.alloc(9);

    data.writeUInt8(0x04, 0);

    data.set(encodeI64LE(expires_at), 1);

    const [subscribePda] = deriveSubscriptionPDA(creator, subscriber);

    const keys = [
        { pubkey: subscriber, isSigner: true, isWritable: true },
        { pubkey: creator_profile, isSigner: false, isWritable: true, },
        { pubkey: subscriber_token_account, isSigner: false, isWritable: true },
        { pubkey: creator_token_account, isSigner: false, isWritable: true },
        { pubkey: subscribePda, isSigner: false, isWritable: true },
        { pubkey: subscriber_nft_account, isSigner: false, isWritable: true },
        { pubkey: subscriber_mint, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false, },
    ];

    return new TransactionInstruction({
        programId: FANSPHERE_PROGRAM_ID,
        keys,
        data,
    });
}

/**
 * Builds the raw instruction for 0x05: LikeComment
 * * 📦 Data Memory Layout (1 byte total):
 * [0]      : 0x05 (Discriminator)
 * * 👥 Accounts Expected by Backend:
 * 0. user              (Signer, Writable) - The user liking the comment
 * 1. comment_state     (Writable)         - Comment PDA (likes counter will be incremented)
 * 2. like_record       (Writable)         - LikeRecord PDA (prevents double liking)
 * 3. system_program    (Readonly)         - Required for allocating like_record PDA
 * * @param user - The public key of the user liking the comment
 * @param comment_PDA - The PDA of the comment being liked
 * @returns TransactionInstruction
 */


export function createLikeCommentInstruction(
    user: PublicKey,
    comment_PDA: PublicKey,
): TransactionInstruction {

    const data = Buffer.alloc(1);//0x02

    data.writeUInt8(0x05, 0);

    const [likepostPda] = deriveLikePDA(comment_PDA, user);

    const keys = [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: comment_PDA, isSigner: false, isWritable: true, },
        { pubkey: likepostPda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false, },
    ];

    return new TransactionInstruction({
        programId: FANSPHERE_PROGRAM_ID,
        keys,
        data,
    });
}
