use crate::instruction::helper::create_pda;
use crate::state::{CreatorProfile, PostState};
use pinocchio::{cpi::Seed, error::ProgramError, AccountView, Address, ProgramResult};

//1 define a account to receive what frontend sent
//outside of the package
pub struct CreateVaultInstructionData {
    pub seed: u64,
    pub price: u64,
    pub content_hash: [u8; 64],
    pub is_private: u8,
    pub title: [u8; 32],
    pub preview_hash: [u8; 64],
}

impl CreateVaultInstructionData {
    // translate the stream of frontend
    pub fn try_from_bytes(data: &[u8]) -> Result<Self, ProgramError> {
        if data.len() != 178 {
            return Err(ProgramError::InvalidInstructionData);
        }

        //slice the first 8 bytes in a prescribed array
        let seed = u64::from_le_bytes(data[1..9].try_into().unwrap());
        let price = u64::from_le_bytes(data[9..17].try_into().unwrap());

        if price != 0 {
            return Err(ProgramError::InvalidInstructionData);
        }

        let content_hash: [u8; 64] = data[17..81].try_into().unwrap();
        let is_private = data[81];

        if is_private != 0 && is_private != 1 {
            return Err(ProgramError::InvalidInstructionData);
        }

        let title: [u8; 32] = data[82..114].try_into().unwrap();
        let preview_hash: [u8; 64] = data[114..178].try_into().unwrap();

        Ok(Self {
            seed,
            price,
            content_hash,
            is_private,
            title,
            preview_hash,
        })
    }
}

//join the creation of account
//inside of the package
pub struct CreateVaultAccounts<'a> {
    pub maker: &'a AccountView,
    pub post_state: &'a AccountView,
    pub profile_state: &'a AccountView,
    pub mint: &'a AccountView,
    pub system_program: &'a AccountView,
}
impl<'a> CreateVaultAccounts<'a> {
    pub fn try_from_bytes(accounts: &'a [AccountView]) -> Result<Self, ProgramError> {
        if accounts.len() < 5 {
            return Err(ProgramError::NotEnoughAccountKeys);
        }

        let maker = &accounts[0];
        let post_state = &accounts[1];
        let profile_state = &accounts[2];
        let mint = &accounts[3];
        let system_program = &accounts[4];

        if !maker.is_signer() {
            return Err(ProgramError::MissingRequiredSignature);
        }

        Ok(Self {
            maker,
            post_state,
            profile_state,
            mint,
            system_program,
        })
    }
}

//create a vault and calculate the PDA

pub struct CreateVault<'a> {
    pub accounts: CreateVaultAccounts<'a>,
    pub args: CreateVaultInstructionData,
    bump: u8,
}

impl<'a> CreateVault<'a> {
    pub fn try_from_parts(
        data: &[u8],
        accounts: &'a [AccountView],
        program_id: &Address,
    ) -> Result<Self, ProgramError> {
        let parsed_accounts = CreateVaultAccounts::try_from_bytes(accounts)?;
        if data[0] != 0x01 {
            return Err(ProgramError::InvalidInstructionData);
        }

        let parsed_args = CreateVaultInstructionData::try_from_bytes(data)?;

        let (expected_pda, bump) = Address::find_program_address(
            &[
                b"post",                                  // 咱们定的前缀暗号
                parsed_accounts.maker.address().as_ref(), // 超模的公钥
                &parsed_args.seed.to_le_bytes(),          // 照片的编号
            ],
            program_id,
        );
        if parsed_accounts.post_state.address() != &expected_pda {
            return Err(ProgramError::InvalidAccountData);
        }

        let (expected_profile_pda, _) = Address::find_program_address(
            &[b"profile", parsed_accounts.maker.address().as_ref()],
            program_id,
        );
        if parsed_accounts.profile_state.address() != &expected_profile_pda {
            return Err(ProgramError::InvalidAccountData); // 敢拿别人的主页来骗我？踢飞！
        }

        // 一切安全，把组装好的总指挥官交出去！
        Ok(Self {
            accounts: parsed_accounts,
            args: parsed_args,
            bump,
        })
    }

    pub fn process(&mut self, program_id: &Address) -> ProgramResult {
        let accounts = &self.accounts;
        let args = &self.args;

        let seed_bytes = args.seed.to_le_bytes();
        let bump_array = [self.bump];
        let post_seeds = [
            Seed::from(b"post"),
            Seed::from(accounts.maker.address().as_ref()),
            Seed::from(&seed_bytes),
            Seed::from(&bump_array),
        ];
        create_pda(
            accounts.maker,          // 超模大哥掏钱交租金
            accounts.post_state,     // 这是咱们算出来的空地皮
            accounts.system_program, // 建委大管家
            PostState::LEN,          // 盖一个 227字节的房子！
            program_id,              // 房产证上写咱们合约的名字
            &post_seeds,             // 带着暗号去签字！
        )?;

        let mut data = accounts.post_state.try_borrow_mut()?;
        let post_state = PostState::load_mut(&mut data)?;

        // 获取可变引用后，直接像填表格一样一项项赋值！
        post_state.is_initialized = 1;
        post_state.maker = accounts.maker.address().clone();
        post_state.price = args.price;
        post_state.content_hash = args.content_hash;
        post_state.seed = args.seed;
        post_state.bump = [self.bump];
        post_state.mint = Address::default();

        // --- 填入新增的社交数据 ---
        post_state.is_private = args.is_private;
        post_state.title = args.title;
        post_state.preview_hash = args.preview_hash;

        // --- 社交计数器必须手动初始化为 0 ---
        post_state.likes = 0;
        post_state.comments_count = 0;
        post_state.tips_total = 0;
        let mut profile_data = accounts.profile_state.try_borrow_mut()?;
        let profile_state = CreatorProfile::load_mut(&mut profile_data)?;
        let cached_subscriber_mint = profile_state.subscriber_mint.clone();

        if profile_state.is_initialized != 1 || profile_state.creator != *accounts.maker.address() {
            return Err(ProgramError::InvalidAccountData);
        }

        post_state.subscriber_mint = cached_subscriber_mint;
        profile_state.total_posts += 1;
        drop(profile_data);
        drop(data);

        Ok(())
    }
}

pub fn createvault(data: &[u8], accounts: &[AccountView], program_id: &Address) -> ProgramResult {
    let mut make_ix = CreateVault::try_from_parts(data, accounts, program_id)?;
    make_ix.process(program_id)
}
