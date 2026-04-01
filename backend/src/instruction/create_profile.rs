use crate::instruction::helper::create_pda;
use crate::state::CreatorProfile;
use pinocchio::{cpi::Seed, error::ProgramError, AccountView, Address, ProgramResult};
use pinocchio_token::instructions::InitializeMint2;

// ==========================================
// 1. Data 校验层
// ==========================================
pub struct CreateProfileInstructionData {
    pub username: [u8; 32],
    pub avater_hash: [u8; 64],
    pub subscription_price: u64,
}

impl CreateProfileInstructionData {
    pub fn try_from_bytes(data: &[u8]) -> Result<Self, ProgramError> {
        if data.len() != 105 {
            return Err(ProgramError::InvalidInstructionData);
        }
        if data[0] != 0x00 {
            return Err(ProgramError::InvalidInstructionData);
        }

        let username: [u8; 32] = data[1..33].try_into().unwrap();
        let avater_hash: [u8; 64] = data[33..97].try_into().unwrap();
        let subscription_price = u64::from_le_bytes(data[97..105].try_into().unwrap());

        if subscription_price == 0 {
            return Err(ProgramError::InvalidInstructionData);
        }
        if username.iter().all(|&b| b == 0) {
            return Err(ProgramError::InvalidInstructionData);
        }

        Ok(Self {
            username,
            avater_hash,
            subscription_price,
        })
    }
}

// ==========================================
// 2. Accounts 校验层：💥 已彻底移除 rent_sysvar
// ==========================================
pub struct CreateProfileAccounts<'a> {
    pub creator: &'a AccountView,
    pub profile_state: &'a AccountView,
    pub subscriber_mint: &'a AccountView,
    pub system_program: &'a AccountView,
    pub token_program: &'a AccountView,
}

impl<'a> CreateProfileAccounts<'a> {
    pub fn try_from_bytes(accounts: &'a [AccountView]) -> Result<Self, ProgramError> {
        // 💥 改回验证 5 个账户
        if accounts.len() < 5 {
            return Err(ProgramError::NotEnoughAccountKeys);
        }

        let creator = &accounts[0];

        if !creator.is_signer() {
            return Err(ProgramError::MissingRequiredSignature);
        }

        Ok(Self {
            creator,
            profile_state: &accounts[1],
            subscriber_mint: &accounts[2],
            system_program: &accounts[3],
            token_program: &accounts[4],
        })
    }
}

pub struct CreateProfile<'a> {
    data: CreateProfileInstructionData,
    accounts: CreateProfileAccounts<'a>,
    profile_bump: u8,
    mint_bump: u8,
}

impl<'a> CreateProfile<'a> {
    pub fn try_from_parts(
        data: &[u8],
        accounts: &'a [AccountView],
        program_id: &Address,
    ) -> Result<Self, ProgramError> {
        let parsed_data = CreateProfileInstructionData::try_from_bytes(data)?;
        let parsed_accounts = CreateProfileAccounts::try_from_bytes(accounts)?;

        let system_program_id = Address::from([0; 32]);
        if parsed_accounts.system_program.address() != &system_program_id {
            return Err(ProgramError::IncorrectProgramId);
        }

        let token_program_id = Address::from([
            6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172, 28, 180,
            133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169,
        ]);
        if parsed_accounts.token_program.address() != &token_program_id {
            return Err(ProgramError::IncorrectProgramId);
        }

        let (expected_profile_pda, profile_bump) = Address::find_program_address(
            &[b"profile", parsed_accounts.creator.address().as_ref()],
            program_id,
        );
        if parsed_accounts.profile_state.address() != &expected_profile_pda {
            return Err(ProgramError::InvalidAccountData);
        }

        let (expected_mint_pda, mint_bump) = Address::find_program_address(
            &[b"mint", parsed_accounts.creator.address().as_ref()],
            program_id,
        );
        if parsed_accounts.subscriber_mint.address() != &expected_mint_pda {
            return Err(ProgramError::InvalidAccountData);
        }

        Ok(Self {
            data: parsed_data,
            accounts: parsed_accounts,
            profile_bump,
            mint_bump,
        })
    }

    pub fn process(&mut self, program_id: &Address) -> ProgramResult {
        let accounts = &self.accounts;
        let profile_data = &self.data;

        let system_program_id = Address::from([0; 32]);

        // 校验 profile_state 账户是否处于绝对的“未创建”初态
        if accounts.profile_state.data_len() != 0
            || unsafe { accounts.profile_state.owner() } != &system_program_id
        {
            return Err(ProgramError::AccountAlreadyInitialized); // 或定义一个更精确的 Error
        }

        // 校验 subscriber_mint 账户是否处于绝对的“未创建”初态
        if accounts.subscriber_mint.data_len() != 0
            || unsafe { accounts.subscriber_mint.owner() } != &system_program_id
        {
            return Err(ProgramError::AccountAlreadyInitialized);
        }

        let profile_bump_array = [self.profile_bump];
        let profile_seeds = [
            Seed::from(b"profile"),
            Seed::from(accounts.creator.address().as_ref()),
            Seed::from(&profile_bump_array),
        ];

        let mint_bump_array = [self.mint_bump];
        let mint_seeds = [
            Seed::from(b"mint"),
            Seed::from(accounts.creator.address().as_ref()),
            Seed::from(&mint_bump_array),
        ];

        // ==========================================
        // 创世铸币 (Create + InitializeMint)
        // ==========================================

        create_pda(
            accounts.creator,
            accounts.subscriber_mint,
            accounts.system_program,
            82,
            accounts.token_program.address(),
            &mint_seeds,
        )?;

        InitializeMint2 {
            mint: accounts.subscriber_mint,
            decimals: 0,
            mint_authority: accounts.profile_state.address(),
            freeze_authority: None, // 绝不留后门，彻底禁用冻结权限
        }
        .invoke()?;

        create_pda(
            accounts.creator,
            accounts.profile_state,
            accounts.system_program,
            CreatorProfile::LEN,
            program_id,
            &profile_seeds,
        )?;

        let mut data = accounts.profile_state.try_borrow_mut()?;
        let profile_state = CreatorProfile::load_mut(&mut data)?;

        profile_state.is_initialized = 1;
        profile_state.creator = accounts.creator.address().clone();
        profile_state.username = profile_data.username;
        profile_state.avatar_hash = profile_data.avater_hash;
        profile_state.subscriber_mint = accounts.subscriber_mint.address().clone();
        profile_state.subscription_price = profile_data.subscription_price;
        profile_state.total_posts = 0;
        profile_state.total_subscribers = 0;
        profile_state.bump = profile_bump_array;

        drop(data);
        Ok(())
    }
}

pub fn createprofile(data: &[u8], accounts: &[AccountView], program_id: &Address) -> ProgramResult {
    let mut make_ix = CreateProfile::try_from_parts(data, accounts, program_id)?;
    make_ix.process(program_id)
}
