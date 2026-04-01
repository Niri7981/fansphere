
use pinocchio::{address::Address, error::ProgramError};

// ==========================================
// 🏗️ 扩容完美版：PostState (体积: 296 bytes)
// ==========================================
#[repr(C)]
pub struct PostState {
    // ⬇️ 8 字节巨无霸区
    pub price: u64,              // 0-8
    pub seed: u64,               // 8-16
    pub tips_total: u64,         // 16-24
    
    // ⬇️ 4 字节中等区
    pub likes: u32,              // 24-28
    pub comments_count: u32,     // 28-32
    
    // ⬇️ 1 字节阵列区
    pub maker: Address,          // 32-64
    pub mint: Address,           // 64-96
    pub subscriber_mint: Address,// 96-128
    pub content_hash: [u8; 64],  // 💥 扩容到 64 字节！ (128-192)
    pub preview_hash: [u8; 64],  // 💥 扩容到 64 字节！ (192-256)
    pub title: [u8; 32],         // 256-288
    
    // ⬇️ 单字节与尾部对齐
    pub is_initialized: u8,      // 288-289
    pub is_private: u8,          // 289-290
    pub bump: [u8; 1],           // 290-291
    pub _padding: [u8; 5],       // 💥 手动补齐到 296 (8的倍数)
}

impl PostState {
    pub const LEN: usize = 296; // 完美长度

    #[inline(always)]
    pub fn load_mut(bytes: &mut [u8]) -> Result<&mut Self, ProgramError> {
        if bytes.len() < Self::LEN { return Err(ProgramError::InvalidAccountData); }
        Ok(unsafe { &mut *(bytes.as_mut_ptr() as *mut Self) })
    }

    #[inline(always)]
    pub fn load(bytes: &[u8]) -> Result<&Self, ProgramError> {
        if bytes.len() != Self::LEN { return Err(ProgramError::InvalidAccountData); }
        Ok(unsafe { &*(bytes.as_ptr() as *const Self) })
    }

    #[inline(always)]
    pub fn set_price(&mut self, price: u64) { self.price = price; }
    #[inline(always)]
    pub fn set_content_hash(&mut self, content_hash: [u8; 64]) { self.content_hash = content_hash; }
    #[inline(always)]
    pub fn set_maker(&mut self, maker: Address) { self.maker = maker; }
    #[inline(always)]
    pub fn set_mint(&mut self, mint: Address) { self.mint = mint; }
}

// ==========================================
// 🏗️ 扩容完美版：CreatorProfile (体积: 184 bytes)
// ==========================================
#[repr(C)]
pub struct CreatorProfile {
    pub subscription_price: u64,  // 0-8
    pub total_posts: u32,         // 8-12
    pub total_subscribers: u32,   // 12-16
    pub creator: Address,         // 16-48
    pub username: [u8; 32],       // 48-80
    pub avatar_hash: [u8; 64],    // 💥 扩容到 64 字节！ (80-144)
    pub subscriber_mint: Address, // 144-176
    pub is_initialized: u8,       // 176-177
    pub bump: [u8; 1],            // 177-178
    pub _padding: [u8; 6],        // 💥 手动补齐到 184
}

impl CreatorProfile {
    pub const LEN: usize = 184;

    #[inline(always)]
    pub fn load_mut(bytes: &mut [u8]) -> Result<&mut Self, ProgramError> {
        if bytes.len() < Self::LEN { return Err(ProgramError::InvalidAccountData); }
        Ok(unsafe { &mut *(bytes.as_mut_ptr() as *mut Self) })
    }
    #[inline(always)]
    pub fn load(bytes: &[u8]) -> Result<&Self, ProgramError> {
        if bytes.len() != Self::LEN { return Err(ProgramError::InvalidAccountData); }
        Ok(unsafe { &*(bytes.as_ptr() as *const Self) })
    }
}

// ==========================================
// 🏗️ 扩容完美版：CommentState (体积: 184 bytes)
// ==========================================
#[repr(C)]
pub struct CommentState {
    pub created_at: i64,        // 0-8
    pub index: u32,             // 8-12
    pub reply_count: u32,       // 12-16
    pub likes: u32,             // 16-20
    pub author: Address,        // 20-52
    pub post: Address,          // 52-84
    pub parent: Address,        // 84-116
    pub content_hash: [u8; 64], // 💥 评论的图床哈希也扩容到 64 字节！ (116-180)
    pub is_initialized: u8,     // 180-181
    pub bump: [u8; 1],          // 181-182
    pub _padding: [u8; 2],      // 💥 手动补齐到 184
}

impl CommentState {
    pub const LEN: usize = 184;

    #[inline(always)]
    pub fn load_mut(bytes: &mut [u8]) -> Result<&mut Self, ProgramError> {
        if bytes.len() < Self::LEN { return Err(ProgramError::InvalidAccountData); }
        Ok(unsafe { &mut *(bytes.as_mut_ptr() as *mut Self) })
    }
    #[inline(always)]
    pub fn load(bytes: &[u8]) -> Result<&Self, ProgramError> {
        if bytes.len() != Self::LEN { return Err(ProgramError::InvalidAccountData); }
        Ok(unsafe { &*(bytes.as_ptr() as *const Self) })
    }
}

// ==========================================
// 🏗️ 完美版：LikerRecord (体积: 72 bytes)
// ==========================================
#[repr(C)]
pub struct LikerRecord {
    pub user: Address,      // 0-32
    pub target: Address,    // 32-64
    pub is_initialized: u8, // 64-65
    pub bump: [u8; 1],      // 65-66
    pub _padding: [u8; 6],  // 💥 补齐到 72
}
impl LikerRecord {
    pub const LEN: usize = 72;
    // ... 省略 load_mut 和 load (跟上面一模一样) ...
    #[inline(always)]
    pub fn load_mut(bytes: &mut [u8]) -> Result<&mut Self, ProgramError> {
        if bytes.len() < Self::LEN { return Err(ProgramError::InvalidAccountData); }
        Ok(unsafe { &mut *(bytes.as_mut_ptr() as *mut Self) })
    }
    #[inline(always)]
    pub fn load(bytes: &[u8]) -> Result<&Self, ProgramError> {
        if bytes.len() != Self::LEN { return Err(ProgramError::InvalidAccountData); }
        Ok(unsafe { &*(bytes.as_ptr() as *const Self) })
    }
}

// ==========================================
// 🏗️ 完美版：SubscriptionRecord (体积: 112 bytes)
// ==========================================
#[repr(C)]
pub struct SubscriptionRecord {
    pub expires_at: i64,     // 0-8
    pub subscriber: Address, // 8-40
    pub creator: Address,    // 40-72
    pub nft_mint: Address,   // 72-104
    pub is_initialized: u8,  // 104-105
    pub bump: [u8; 1],       // 105-106
    pub _padding: [u8; 6],   // 💥 补齐到 112
}
impl SubscriptionRecord {
    pub const LEN: usize = 112;
    // ... 省略 load_mut 和 load (跟上面一模一样) ...
    #[inline(always)]
    pub fn load_mut(bytes: &mut [u8]) -> Result<&mut Self, ProgramError> {
        if bytes.len() < Self::LEN { return Err(ProgramError::InvalidAccountData); }
        Ok(unsafe { &mut *(bytes.as_mut_ptr() as *mut Self) })
    }
    #[inline(always)]
    pub fn load(bytes: &[u8]) -> Result<&Self, ProgramError> {
        if bytes.len() != Self::LEN { return Err(ProgramError::InvalidAccountData); }
        Ok(unsafe { &*(bytes.as_ptr() as *const Self) })
    }
}