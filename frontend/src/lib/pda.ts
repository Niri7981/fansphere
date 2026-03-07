import { PublicKey } from '@solana/web3.js';
import {
    FANSPHERE_PROGRAM_ID,
    SEED_PROFILE,
    SEED_POST,
    SEED_SUBSCRIPTION,
    SEED_LIKE,
    SEED_COMMENT,
    SEED_REPLY
} from '../config/constants';

import { encodeU32LE, encodeU64LE } from './serialization';




/**
 * 1. 推导创作者主页 PDA (CreatorProfile)
 * @description 每个创作者在这个平台上唯一的资料卡。
 * @rust_seeds [ b"profile", creator_pubkey]
 * @param creatorPubkey 创作者的钱包公钥
 * @returns [PDA公钥, bump值]
 */
export function deriveProfilePDA(creatorPubkey: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [SEED_PROFILE, creatorPubkey.toBuffer()],
        FANSPHERE_PROGRAM_ID
    );
}

/**
 * 2. 推导帖子 PDA (PostState)
 * @description 创作者发布的每一篇内容（公开或私密）的物理存储空间。
 * @rust_seeds [b"post", creator_pubkey, seed_u64_le]
 * @param makerPubkey 创作者的钱包公钥
 * @param seed 帖子的唯一单号 (必须是 bigint，会被转为 8 字节小端序)
 * @returns [PDA公钥, bump值]
 */
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
/**
 * 3. 推导订阅记录 PDA (SubscriptionRecord)
 * @description 记录某个粉丝订阅了某个创作者，包含过期时间。
 * @rust_seeds [b"subscription", creator_pubkey, subscriber_pubkey]
 * @param creatorPubkey 创作者的钱包公钥 (被订阅者)
 * @param subscriberPubkey 粉丝的钱包公钥 (订阅者)
 * @returns [PDA公钥, bump值]
 */
export function deriveSubscriptionPDA(
    creatorPubkey: PublicKey,
    subscriberPubkey: PublicKey,
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [SEED_SUBSCRIPTION, creatorPubkey.toBuffer(), subscriberPubkey.toBuffer()],
        FANSPHERE_PROGRAM_ID
    );
}

/**
 * 4. 推导点赞记录 PDA (LikeRecord)
 * @description 确保每个人对同一个目标只能点赞一次的防刷机制。
 * @rust_seeds [b"like", target_pda, user_pubkey]
 * @param targetPda 被点赞目标的 PDA (极其巧妙：可以是 Post PDA，也可以是 Comment PDA)
 * @param userPubkey 正在点赞的用户的钱包公钥
 * @returns [PDA公钥, bump值]
 */
export function deriveLikePDA(targetPda: PublicKey, userPubkey: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [SEED_LIKE, targetPda.toBuffer(), userPubkey.toBuffer()],
        FANSPHERE_PROGRAM_ID
    );
}

/**
 * 5. 推导根评论 PDA (CommentState)
 * @description 直接挂在帖子下方的第一级评论。
 * @rust_seeds [b"comment", post_pda, index_u32_le]
 * @param parent 该评论所属的帖子 PDA
 * @param index 该帖子下的评论序号 (前端需传入第几条，会被转为 4 字节小端序)
 * @returns [PDA公钥, bump值]
 */
export function deriveCommentPDA(parent: PublicKey, index: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [SEED_COMMENT,
            parent.toBuffer(),
            encodeU32LE(index)],
        FANSPHERE_PROGRAM_ID,
    );
}


/**
 * 6. 推导楼中楼回复 PDA (CommentState - Reply)
 * @description 回复某条评论的二级评论。
 * @rust_seeds [b"reply", parent_comment_pda, reply_index_u32_le]
 * @param parentCommentPda 被回复的那条父评论的 PDA
 * @param replyIndex 父评论下的回复序号 (会被转为 4 字节小端序)
 * @returns [PDA公钥, bump值]
 */

export function deriveReplyPDA(parentCommentPDA: PublicKey, replyIndex: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [SEED_REPLY,
            encodeU32LE(replyIndex),
            parentCommentPDA.toBuffer()
        ],
        FANSPHERE_PROGRAM_ID,
    );
}