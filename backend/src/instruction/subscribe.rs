use pinocchio::{
    cpi::Seed,
    error::ProgramError,
    sysvars::{clock::Clock, Sysvar},
    AccountView, Address, ProgramResult,
};
use pinocchio_token::instructions::Transfer;

use crate::{helper::create_pda, CreatorProfile, SubscriptionRecord};

pub struct SubscribeData {
    pub expires_at: i64,
}
impl SubscribeData {
    pub fn try_from_bytes(data: &[u8]) -> Result<Self, ProgramError> {
        if data.len() != 9 {
            return Err(ProgramError::InvalidInstructionData);
        }
        let expires_at = i64::from_le_bytes(data[1..9].try_into().unwrap());
        Ok(Self { expires_at })
    }
}

pub struct SubscribeAccounts<'a> {
    pub subscriber: &'a AccountView,
    pub creator_profile: &'a AccountView,
    pub subscriber_token_account: &'a AccountView,
    pub creator_token_account: &'a AccountView,
    pub subscription_record: &'a AccountView,
    pub subscriber_nft_account: &'a AccountView,
    pub subscriber_mint: &'a AccountView,
    pub token_program: &'a AccountView,
    pub system_program: &'a AccountView,
}

impl<'a> SubscribeAccounts<'a> {
    pub fn try_from_bytes(accounts: &'a [AccountView]) -> Result<Self, ProgramError> {
        if accounts.len() < 9 {
            return Err(ProgramError::NotEnoughAccountKeys);
        }

        let subscriber = &accounts[0];
        let creator_profile = &accounts[1];
        let subscriber_token_account = &accounts[2];
        let creator_token_account = &accounts[3];
        let subscription_record = &accounts[4];
        let subscriber_nft_account = &accounts[5];
        let subscriber_mint = &accounts[6];
        let token_program = &accounts[7];
        let system_program = &accounts[8];

        if !subscriber.is_signer() {
            return Err(ProgramError::MissingRequiredSignature);
        }

        Ok(Self {
            subscriber,
            creator_profile,
            subscriber_token_account,
            creator_token_account,
            subscription_record,
            subscriber_nft_account,
            subscriber_mint,
            token_program,
            system_program,
        })
    }
}

pub struct Subscribe<'a> {
    pub accounts: SubscribeAccounts<'a>,
    pub args: SubscribeData,
    pub bump: u8,
}

impl<'a> Subscribe<'a> {
    pub fn try_from_parts(
        data: &[u8],
        accounts: &'a [AccountView],
        program_id: &Address,
    ) -> Result<Self, ProgramError> {
        let parsed_accounts = SubscribeAccounts::try_from_bytes(accounts)?;
        if data[0] != 0x04 {
            return Err(ProgramError::InvalidInstructionData);
        }
        let args = SubscribeData::try_from_bytes(data)?;

        let profile_data = parsed_accounts.creator_profile.try_borrow()?;
        let profile_state = CreatorProfile::load(&profile_data)?;
        let real_creator_pubkey = profile_state.creator.clone();
        drop(profile_data);

        let (expected_pda, bump) = Address::find_program_address(
            &[
                b"subscription",
                real_creator_pubkey.as_ref(),
                parsed_accounts.subscriber.address().as_ref(),
            ],
            program_id,
        );

        if parsed_accounts.subscription_record.address() != &expected_pda {
            return Err(ProgramError::InvalidAccountData);
        }

        Ok(Self {
            accounts: parsed_accounts,
            args,
            bump,
        })
    }

    pub fn process(&mut self, program_id: &Address) -> ProgramResult {
        let accounts = &self.accounts;
        let bump_array = [self.bump];

        let profile_data = accounts.creator_profile.try_borrow()?;
        let profile_state = CreatorProfile::load(&profile_data)?;
        let price = profile_state.subscription_price;
        let real_creator_pubkey = profile_state.creator.clone();
        drop(profile_data);

        let bending = accounts.subscriber.address().as_ref();
        let subscribe_seed = [
            Seed::from(b"subscription"),
            Seed::from(real_creator_pubkey.as_ref()),
            Seed::from(bending),
            Seed::from(&bump_array),
        ];

        Transfer {
            from: accounts.subscriber_token_account,
            to: accounts.creator_token_account,
            authority: accounts.subscriber,
            amount: price,
        }
        .invoke()?;

        create_pda(
            accounts.subscriber,
            accounts.subscription_record,
            accounts.system_program,
            SubscriptionRecord::LEN,
            program_id,
            &subscribe_seed,
        )?;

        let mut data = accounts.subscription_record.try_borrow_mut()?;
        let subscribe_state = SubscriptionRecord::load_mut(&mut data)?;

        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;
        let thirty_days_seconds: i64 = 30 * 24 * 3600;
        let new_expires_at = current_timestamp.checked_add(thirty_days_seconds).unwrap();

        subscribe_state.is_initialized = 1;
        subscribe_state.expires_at = new_expires_at;
        subscribe_state.bump = [self.bump];
        subscribe_state.subscriber = accounts.subscriber.address().clone();
        subscribe_state.nft_mint = accounts.subscriber_nft_account.address().clone();
        subscribe_state.creator = real_creator_pubkey;

        drop(data);

        Ok(())
    }
}
pub fn createsubscribe(
    data: &[u8],
    accounts: &[AccountView],
    program_id: &Address,
) -> ProgramResult {
    let mut make_ix = Subscribe::try_from_parts(data, accounts, program_id)?;
    make_ix.process(program_id)
}
