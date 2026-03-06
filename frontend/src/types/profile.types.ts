import { PublicKey } from "@solana/web3.js";

export interface CreateProfile {
    is_initialized: boolean,       // init buttron
    creator: PublicKey,         //public key
    username: string,       //用户名 UTF-8用户名
    avatar_hash: string,    //Arweave 头像 TX 哈希
    subscriber_mint: PublicKey, // the address of Fans NFT
    subscription_price: bigint,  //订阅月费
    total_posts: number,         //the number of total posts
    total_subscribers: number,   //the number of total fans
    bump: number,            //used by PDA
}

export interface SubscriptionRecord {
    is_initialized: Boolean,
    subscriber: PublicKey,
    creator: PublicKey,
    expires_at: bigint, //订阅制度，如果终身就是i64:Max
    nft_mint: PublicKey,
    bump: number,
}