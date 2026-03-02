/// Escrow 状态结构
///
/// 存储托管交易的所有条款和状态
use core::mem::size_of;
use pinocchio::{address::Address, error::ProgramError};

// ==========================================
// 🏗️ 数据图纸：FanSphere vault of creator
// ==========================================

#[repr(C)]
pub struct PostState {
    pub is_initialized: u8,     //offset 0,size:1
    pub maker: Address,         // 1 ,32
    pub price: u64,             //33 8
    pub content_hash: [u8; 32], //content of what make post // 41 32
    pub seed: u64,              //73 8
    pub bump: [u8; 1],          //81 1
    pub mint: Address,          // 82 32
    pub is_private: u8,         // 114 1(0=public 1= subscriber-only)
    pub title: [u8; 32],        //115 32(UTF-8,MAX 32 bytes)
    pub preview_hash: [u8; 32], //(Arweave 模糊预览 TX 哈希)
    pub likes: u32,
    pub comments_count: u32,
    pub subscriber_mint: Address, //(NFT FNAS TOKEN)
    pub tips_total: u64,          //积累打赏量
}

impl PostState {
    //1 caluate automaticallty the length of total bytes
    pub const LEN: usize = core::mem::size_of::<u8>()
        + size_of::<Address>()
        + size_of::<u64>()
        + size_of::<[u8; 32]>()
        + size_of::<u64>()
        + size_of::<[u8; 1]>()
        + size_of::<Address>();

    //2 zero-copy and examine if the memory is enough
    // load_mut function is to change the data
    #[inline(always)]
    pub fn load_mut(bytes: &mut [u8]) -> Result<&mut Self, ProgramError> {
        if bytes.len() < Self::LEN {
            return Err(ProgramError::InvalidAccountData);
        }
        // use as_mut_ptr  to tell what is the started memory address
        Ok(unsafe { &mut *(bytes.as_mut_ptr() as *mut Self) })
    }
    //to get the unmulitable data(read data)
    #[inline(always)]
    pub fn load(bytes: &[u8]) -> Result<&Self, ProgramError> {
        if bytes.len() != Self::LEN {
            return Err(ProgramError::InvalidAccountData);
        }
        Ok(unsafe { &*(bytes.as_ptr() as *const Self) })
    }
    #[inline(always)]
    pub fn set_inner(
        &mut self,
        maker: Address,
        price: u64,
        content_hash: [u8; 32],
        seed: u64,
        bump: [u8; 1],
        mint: Address,
    ) {
        self.is_initialized = 1; // 1 代表 true
        self.maker = maker;
        self.mint = mint;
        self.price = price;
        self.content_hash = content_hash;
        self.bump = bump;
        self.seed = seed;
    }

    #[inline(always)]
    pub fn set_price(&mut self, price: u64) {
        self.price = price;
    }

    /// 单独修改照片哈希（如果超模发现传错图了，想换一张）
    #[inline(always)]
    pub fn set_content_hash(&mut self, content_hash: [u8; 32]) {
        self.content_hash = content_hash;
    }

    // 下面这些虽然不常改，但作为底层数据结构，写上以保持规范完整
    #[inline(always)]
    pub fn set_maker(&mut self, maker: Address) {
        self.maker = maker;
    }

    #[inline(always)]
    pub fn set_mint(&mut self, mint: Address) {
        self.mint = mint;
    }
}

// the CreatorProfile
// PDA seeds:["creator,maker_pubkey"]
#[repr(C)]
pub struct CreatorProfile {
    pub is_initialized: u8,       // init buttron
    pub creator: Address,         //public key
    pub username: [u8; 32],       //用户名 UTF-8用户名
    pub avatar_hash: [u8; 32],    //Arweave 头像 TX 哈希
    pub subscriber_mint: Address, // the address of Fans NFT
    pub subscription_price: u64,  //订阅月费
    pub total_posts: u32,         //the number of total posts
    pub total_subscribers: u32,   //the number of total fans
    pub bump: [u8; 1],            //used by PDA
}
// LEN = 146 bytes,

// the CommentState
//根评论 PDA seeds: ["comment", post_pda, comment_index_le_bytes]
//回复 PDA seeds: ["reply", parent_comment_pda, reply_index_le_bytes]
#[repr(C)]
pub struct CommentState {
    pub is_initialized: u8, //
    pub author: Address,
    pub post: Address,          // where is the root
    pub parent: Address,        // if it is 0,this comment is the Root comments，else it is reply
    pub content_hash: [u8; 32], // put the content of comment in Arweave

    pub index: u32,       //the location of some comments of replies in the fathernode
    pub reply_count: u32, //This is used to display "View all 99 replies" without actually counting them.
    pub likes: u32,       //
    pub created_at: i64,  // Timestamp
    pub bump: [u8; 1],
}
// LEN = 150

//Likerecord
//PDA seeds: ["like", target_pda, user_pubkey]（target 可以是 Post 或 Comment）
#[repr(C)]
pub struct LikerRecord {
    pub is_initialized: u8,
    pub user: Address,   //点赞者
    pub target: Address, // 32  (被点赞的 Post/Comment PDA)
    pub bump: [u8; 1],
}
//LEN = 66;

// SubscriptionRecord
// PDA SEEDS:["subsciption",creator_pubkey,subscriber_pubkey]
pub struct SubscriptionRecord {
    pub is_initialized: u8,
    pub subscriber: Address,
    pub creator: Address,
    pub expires_at: i64, //订阅制度，如果终身就是i64:Max
    pub nft_mint: Address,
    pub bump: [u8; 1],
}
//LEN = 106
