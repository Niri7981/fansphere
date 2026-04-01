use pinocchio::{
    cpi::Seed,
    error::ProgramError,
    sysvars::{clock::Clock, Sysvar},
    AccountView, Address, ProgramResult,
};
use pinocchio_token::instructions::{MintTo, Transfer};

use crate::{helper::create_pda, CreatorProfile, SubscriptionRecord};
use pinocchio_token::state::TokenAccount;

//the mint address is juet for test
#[cfg(feature = "localnet")]
pub const EXPECTED_PAYMENT_MINT: Address =
    Address::from_str_const("2WrQHTS2b5zvzPkfevcGtMdbPKtn1kn7PGYp25FVYYVj");

#[cfg(not(feature = "localnet"))]
pub const EXPECTED_PAYMENT_MINT: Address =
    Address::from_str_const("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

pub struct SubscribeData {} // 彻底掏空

impl SubscribeData {
    pub fn try_from_bytes(data: &[u8]) -> Result<Self, ProgramError> {
        // 只有 1 个字节的 Instruction 编号
        if data.len() != 1 {
            return Err(ProgramError::InvalidInstructionData);
        }
        Ok(Self {})
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

        let spl_token_id = Address::from_str_const("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

        let system_program_id = Address::from_str_const("11111111111111111111111111111111");

        if accounts.token_program.address() != &spl_token_id
            || accounts.system_program.address() != &system_program_id
        {
            return Err(ProgramError::IncorrectProgramId);
        }

        let profile_data = accounts.creator_profile.try_borrow()?;
        let profile_state = CreatorProfile::load(&profile_data)?;

        if profile_state.is_initialized != 1 {
            return Err(ProgramError::InvalidAccountData);
        }

        let price = profile_state.subscription_price;
        let real_creator_pubkey = profile_state.creator.clone();
        let profile_bump = profile_state.bump[0];

        let (expected_profile_pda, _) =
            Address::find_program_address(&[b"profile", real_creator_pubkey.as_ref()], program_id);

        if accounts.creator_profile.address() != &expected_profile_pda {
            return Err(ProgramError::InvalidAccountData);
        }
        if accounts.subscriber_mint.address() != &profile_state.subscriber_mint {
            return Err(ProgramError::InvalidAccountData); // 敢拿假印钞机来忽悠我？滚！
        }

        drop(profile_data);
        if unsafe { accounts.subscriber_token_account.owner() } != &spl_token_id
            || unsafe { accounts.creator_token_account.owner() } != &spl_token_id
            || unsafe { accounts.subscriber_nft_account.owner() } != &spl_token_id
        {
            return Err(ProgramError::IllegalOwner);
        }

        let sub_token_data = accounts.subscriber_token_account.try_borrow()?;
        let creator_token_data = accounts.creator_token_account.try_borrow()?;
        let nft_token_data = accounts.subscriber_nft_account.try_borrow()?;

        if sub_token_data.len() != 165
            || creator_token_data.len() != 165
            || nft_token_data.len() != 165
        {
            return Err(ProgramError::InvalidAccountData); // 传进来的根本不是代币账户
        }

        let sub_token = unsafe { TokenAccount::from_bytes_unchecked(&sub_token_data) };
        let creator_token = unsafe { TokenAccount::from_bytes_unchecked(&creator_token_data) };
        let nft_token = unsafe { TokenAccount::from_bytes_unchecked(&nft_token_data) };

        // 付钱口袋的主人必须是 subscriber
        if sub_token.owner() != accounts.subscriber.address() {
            return Err(ProgramError::InvalidAccountData);
        }
        if creator_token.owner() != &real_creator_pubkey {
            return Err(ProgramError::InvalidAccountData);
        }
        if nft_token.mint() != accounts.subscriber_mint.address() {
            return Err(ProgramError::InvalidAccountData);
        }
        if nft_token.owner() != accounts.subscriber.address() {
            return Err(ProgramError::InvalidAccountData);
        }
        // 两个口袋装的必须是同一种币！(比如都是 USDC)
        if sub_token_data[0..32] != EXPECTED_PAYMENT_MINT.as_ref()[..] {
            return Err(ProgramError::InvalidAccountData);
        }
        if creator_token_data[0..32] != EXPECTED_PAYMENT_MINT.as_ref()[..] {
            return Err(ProgramError::InvalidAccountData);
        }
        drop(sub_token_data);
        drop(creator_token_data);
        drop(nft_token_data);

        let clock = Clock::get()?;
        let thirty_days_seconds: i64 = 30 * 24 * 3600;
        let current_timestamp = clock.unix_timestamp;

        if accounts.subscription_record.data_len() == 0 {
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

            let profile_bump_array = [profile_bump];

            let profile_signer_seeds = [
                Seed::from(b"profile"),
                Seed::from(real_creator_pubkey.as_ref()),
                Seed::from(&profile_bump_array),
            ];
            MintTo {
                mint: accounts.subscriber_mint,
                account: accounts.subscriber_nft_account,
                mint_authority: accounts.creator_profile, // 主页 PDA 才有印钞权
                amount: 1,                                // 发放 1 张 VIP 凭证
            }
            .invoke_signed(&[(&profile_signer_seeds).into()])?;

            let mut sub_data = accounts.subscription_record.try_borrow_mut()?;
            let sub_state = SubscriptionRecord::load_mut(&mut sub_data)?;

            sub_state.is_initialized = 1;
            sub_state.creator = real_creator_pubkey.clone(); // 假设你存的是 profile
            sub_state.subscriber = accounts.subscriber.address().clone();
            sub_state.nft_mint = accounts.subscriber_mint.address().clone();
            sub_state.expires_at = current_timestamp.checked_add(thirty_days_seconds).unwrap();
            drop(sub_data);

            let mut profile_data = accounts.creator_profile.try_borrow_mut()?;
            let profile_state = CreatorProfile::load_mut(&mut profile_data)?;
            profile_state.total_subscribers += 1;
            drop(profile_data);
        } else {
            let mut sub_data = accounts.subscription_record.try_borrow_mut()?;
            let sub_state = SubscriptionRecord::load_mut(&mut sub_data)?;

            if sub_state.is_initialized != 1
                || sub_state.creator != real_creator_pubkey
                || sub_state.subscriber != *accounts.subscriber.address()
                || sub_state.nft_mint != *accounts.subscriber_mint.address()
            {
                return Err(ProgramError::InvalidAccountData);
            }

            Transfer {
                from: accounts.subscriber_token_account,
                to: accounts.creator_token_account,
                authority: accounts.subscriber,
                amount: price,
            }
            .invoke()?;

            if sub_state.expires_at > current_timestamp {
                sub_state.expires_at = sub_state
                    .expires_at
                    .checked_add(thirty_days_seconds)
                    .unwrap();
            // 还没到期，直接加 30 天
            } else {
                sub_state.expires_at = current_timestamp.checked_add(thirty_days_seconds).unwrap();
                // 已经过期，从今天起算 30 天
            }
            drop(sub_data);
        }

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
