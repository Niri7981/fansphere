use pinocchio::{cpi::Seed, error::ProgramError, AccountView, Address, ProgramResult};

use crate::{helper::create_pda, SubscriptionRecord};

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
    pub creator: &'a AccountView,
    pub nft_mint: &'a AccountView,
    pub subscribe_state: &'a AccountView,
    pub system_program: &'a AccountView,
}

impl<'a> SubscribeAccounts<'a> {
    pub fn try_from_bytes(accounts: &'a [AccountView]) -> Result<Self, ProgramError> {
        if accounts.len() < 5 {
            return Err(ProgramError::NotEnoughAccountKeys);
        }

        let subscriber = &accounts[0];
        let creator = &accounts[1];
        let nft_mint = &accounts[2];
        let subscribe_state = &accounts[3];
        let system_program = &accounts[4];

        if !subscriber.is_signer() {
            return Err(ProgramError::MissingRequiredSignature);
        }

        Ok(Self {
            subscriber,
            creator,
            nft_mint,
            subscribe_state,
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
        if data[0] != 0x03 {
            return Err(ProgramError::InvalidInstructionData);
        }
        let args = SubscribeData::try_from_bytes(data)?;

        let (expected_pda, bump) = Address::find_program_address(
            &[
                b"subscribe",
                parsed_accounts.subscriber.address().as_ref(),
                parsed_accounts.creator.address().as_ref(),
            ],
            program_id,
        );

        if parsed_accounts.subscribe_state.address() != &expected_pda {
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

        let bending = accounts.nft_mint.address().as_ref();
        let subscribe_seed = [
            Seed::from(b"subscribe"),
            Seed::from(accounts.creator.address().as_ref()),
            Seed::from(bending),
            Seed::from(&bump_array),
        ];

        create_pda(
            accounts.subscriber,
            accounts.subscribe_state,
            accounts.system_program,
            SubscriptionRecord::LEN,
            program_id,
            &subscribe_seed,
        )?;

        let mut data = accounts.subscribe_state.try_borrow_mut()?;
        let subscribe_state = SubscriptionRecord::load_mut(&mut data)?;

        subscribe_state.is_initialized = 1;
        subscribe_state.expires_at = self.args.expires_at;
        subscribe_state.bump = [self.bump];
        subscribe_state.subscriber = accounts.subscriber.address().clone();
        subscribe_state.nft_mint = accounts.nft_mint.address().clone();
        subscribe_state.creator = accounts.creator.address().clone();

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
