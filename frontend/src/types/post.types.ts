import { PublicKey } from "@solana/web3.js";


export interface PostState {
    is_initialized: boolean,     //offset 0,size:1
    maker: PublicKey,         // 1 ,32
    price: bigint,             //33 8
    content_hash: string, //content of what make post // 41 32
    seed: bigint,              //73 8
    bump: number,          //81 1
    mint: PublicKey,          // 82 32
    is_private: boolean,         // 114 1(0=public 1= subscriber-only)
    title: string,        //115 32(UTF-8,MAX 32 bytes)
    preview_hash: string, //(Arweave 模糊预览 TX 哈希)
    likes: number,
    comments_count: number,
    subscriber_mint: PublicKey, //(NFT FNAS TOKEN)
    tips_total: bigint,          //积累打赏量
}

export interface CommentState {
    is_initialized: boolean, //
    author: PublicKey,
    post: PublicKey,          // where is the root
    parent: PublicKey,        // if it is 0,this comment is the Root comments，else it is reply
    content_hash: string, // put the content of comment in Arweave
    index: number,       //the location of some comments of replies in the fathernode
    reply_count: number, //This is used to display "View all 99 replies" without actually counting them.
    likes: number,       //
    created_at: bigint,  // Timestamp
    bump: number,
}

export interface LikeRecord {
    is_initialized: boolean,
    user: PublicKey,   //点赞者
    target: PublicKey, // 32  (被点赞的 Post/Comment PDA)
    bump: number,
}