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
    pub is_initialized: u8,
    pub maker: Address,
    pub price: u64,
    pub content_hash: [u8; 32], //content of what make post
    pub seed: u64,
    pub bump: [u8; 1],
    pub mint: Address,
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
