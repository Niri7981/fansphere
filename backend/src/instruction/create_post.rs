use crate::instruction::helper::create_pda;
use crate::state::PostState;
use core::mem::size_of;
use pinocchio::{cpi::Seed, error::ProgramError, AccountView, Address, ProgramResult};

//1 define a account to receive what frontend sent
//outside of the package
pub struct CreateVaultInstructionData {
    pub seed: u64,
    pub price: u64,
    pub content_hash: [u8; 32],
}

impl CreateVaultInstructionData {
    // translate the stream of frontend
    pub fn try_from_bytes(data: &[u8]) -> Result<Self, ProgramError> {
        if data.len() != size_of::<u64>() * 2 + size_of::<[u8; 32]>() + 1 {
            return Err(ProgramError::InvalidInstructionData);
        }

        let seed = u64::from_le_bytes(data[1..9].try_into().unwrap());
        let price = u64::from_le_bytes(data[9..17].try_into().unwrap());
        let content_hash: [u8; 32] = data[17..49].try_into().unwrap();
        Ok(Self {
            seed,
            price,
            content_hash,
        })
    }
}

//join the creation of account
//inside of the package
pub struct CreateVaultAccounts<'a> {
    pub maker: &'a AccountView,
    pub post_state: &'a AccountView,
    pub mint: &'a AccountView,
    pub system_program: &'a AccountView,
}
impl<'a> CreateVaultAccounts<'a> {
    pub fn try_from_bytes(accounts: &'a [AccountView]) -> Result<Self, ProgramError> {
        if accounts.len() < 4 {
            return Err(ProgramError::NotEnoughAccountKeys);
        }

        let maker = &accounts[0];
        let post_state = &accounts[1];
        let mint = &accounts[2];
        let system_program = &accounts[3];

        if !maker.is_signer() {
            return Err(ProgramError::MissingRequiredSignature);
        }

        Ok(Self {
            maker,
            post_state,
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
            PostState::LEN,          // 盖一个 106 字节的房子！
            program_id,              // 房产证上写咱们合约的名字
            &post_seeds,             // 带着暗号去签字！
        )?;

        let mut data = accounts.post_state.try_borrow_mut()?;
        let post_state = PostState::load_mut(&mut data)?;

        post_state.set_inner(
            self.accounts.maker.address().clone(),
            self.args.price,
            self.args.content_hash,
            self.args.seed,
            [self.bump],
            self.accounts.mint.address().clone(),
        );

        drop(data);

        Ok(())
    }
}

pub fn createvault(data: &[u8], accounts: &[AccountView], program_id: &Address) -> ProgramResult {
    let mut make_ix = CreateVault::try_from_parts(data, accounts, program_id)?;
    make_ix.process(program_id)
}
