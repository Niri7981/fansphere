use crate::instruction::helper::create_pda;
use crate::state::CreatorProfile;
use core::mem::size_of;
use pinocchio::{cpi::Seed, error::ProgramError, AccountView, Address, ProgramResult};
// ==========================================
// 1. Data: 绝对信任前端输入的字段 (64字节)
// ==========================================
pub struct CreateProfileInstructionData {
    pub username: [u8; 32],
    pub avater_hash: [u8; 32],
    pub subscription_price: u64,
}

impl CreateProfileInstructionData {
    pub fn try_from_bytes(data: &[u8]) -> Result<Self, ProgramError> {
        if data.len() != size_of::<[u8; 32]>() * 2 + size_of::<u64>() + 1 {
            return Err(ProgramError::InvalidInstructionData);
        }

        let username: [u8; 32] = data[1..33].try_into().unwrap();
        let avater_hash: [u8; 32] = data[33..65].try_into().unwrap();
        let subscription_price = u64::from_le_bytes(data[65..73].try_into().unwrap());

        Ok(Self {
            username,
            avater_hash,
            subscription_price,
        })
    }
}

// ==========================================
// 2. Accounts: the core three accounts
// ==========================================

pub struct CreateProfileAccounts<'a> {
    pub creator: &'a AccountView,
    pub subscriber_mint: &'a AccountView,
    pub profile_state: &'a AccountView,
    pub system_program: &'a AccountView,
}

impl<'a> CreateProfileAccounts<'a> {
    pub fn try_from_bytes(accounts: &'a [AccountView]) -> Result<Self, ProgramError> {
        if accounts.len() < 4 {
            return Err(ProgramError::InvalidAccountData);
        }

        let creator = &accounts[0];
        let subscriber_mint = &accounts[1];
        let profile_state = &accounts[2];
        let system_program = &accounts[3];
        //SERCUTIFY CHECK:
        if !creator.is_signer() {
            return Err(ProgramError::MissingRequiredSignature);
        }

        Ok(Self {
            creator,
            subscriber_mint,
            profile_state,
            system_program,
        })
    }
}

pub struct CreateProfile<'a> {
    data: CreateProfileInstructionData,
    accounts: CreateProfileAccounts<'a>,
    bump: u8,
}

impl<'a> CreateProfile<'a> {
    pub fn try_from_parts(
        data: &[u8],
        accounts: &'a [AccountView],
        program_id: &Address,
    ) -> Result<Self, ProgramError> {
        let parsed_accounts = CreateProfileAccounts::try_from_bytes(accounts)?;

        if data[0] != 0x00 {
            return Err(ProgramError::InvalidInstructionData);
        }
        let parsed_data = CreateProfileInstructionData::try_from_bytes(data)?;
        let (expected_pda, bump) = Address::find_program_address(
            &[b"profile", parsed_accounts.creator.address().as_ref()],
            program_id,
        );

        if parsed_accounts.profile_state.address() != &expected_pda {
            return Err(ProgramError::InvalidAccountData);
        }

        Ok(Self {
            data: parsed_data,
            accounts: parsed_accounts,
            bump,
        })
    }

    pub fn process(&mut self, program_id: &Address) -> ProgramResult {
        let accounts = &self.accounts;
        let profile_data = &self.data;
        let bump_array = [self.bump];

        let profile_seeds = [
            Seed::from(b"profile"),
            Seed::from(accounts.creator.address().as_ref()),
            Seed::from(&bump_array),
        ];
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
        profile_state.bump = bump_array;

        drop(data);
        Ok(())
    }
}

pub fn createprofile(data: &[u8], accounts: &[AccountView], program_id: &Address) -> ProgramResult {
    let mut make_ix = CreateProfile::try_from_parts(data, accounts, program_id)?;
    make_ix.process(program_id)
}
