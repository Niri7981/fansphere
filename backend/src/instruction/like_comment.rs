use crate::instruction::helper::create_pda;
use crate::state::{CommentState, LikerRecord};

use pinocchio::{cpi::Seed, error::ProgramError, AccountView, Address, ProgramResult};

// ==========================================
// 1. Account Context Validation
// ==========================================
pub struct LikeCommentAccount<'a> {
    pub user: &'a AccountView,
    pub comment_state: &'a AccountView,
    pub like_record: &'a AccountView,
    pub system_program: &'a AccountView,
}

// examine the content of frontend,and return the pointed LikeCommentAccount
impl<'a> LikeCommentAccount<'a> {
    pub fn try_from_bytes(accounts: &'a [AccountView]) -> Result<Self, ProgramError> {
        if accounts.len() < 4 {
            return Err(ProgramError::NotEnoughAccountKeys);
        }
        let user = &accounts[0];
        let comment_state = &accounts[1];
        let like_record = &accounts[2];
        let system_program = &accounts[3];

        //SECURITY CHAECK:Ensure the user actually authoried this transaction
        //This prenvnts malicious actor from draining someont else's wallet to pay for PDA rent.
        if !user.is_signer() {
            return Err(ProgramError::MissingRequiredSignature);
        }
        Ok(Self {
            user,
            comment_state,
            like_record,
            system_program,
        })
    }
}

// ==========================================
// 2. Instruction parsing & cryptographic checks
// ==========================================
pub struct LikeComment<'a> {
    pub accounts: LikeCommentAccount<'a>,
    bump: u8,
}

impl<'a> LikeComment<'a> {
    pub fn try_from_parts(
        data: &[u8],
        accounts: &'a [AccountView],
        program_id: &Address,
    ) -> Result<Self, ProgramError> {
        let parsed_accounts = LikeCommentAccount::try_from_bytes(accounts)?;

        //the instruction of like is only need one bytes(the name of instruiction)
        if data.len() != 1 || data[0] != 0x05 {
            return Err(ProgramError::InvalidInstructionData);
        }

        let (expected_pda, bump) = Address::find_program_address(
            &[
                b"like",
                parsed_accounts.comment_state.address().as_ref(),
                parsed_accounts.user.address().as_ref(),
            ],
            program_id,
        );
        if parsed_accounts.like_record.address() != &expected_pda {
            return Err(ProgramError::InvalidAccountData);
        }

        if parsed_accounts.like_record.data_len() > 0 {
            return Err(ProgramError::AccountAlreadyInitialized);
        }

        Ok(Self {
            accounts: parsed_accounts,
            bump,
        })
    }
    // ==========================================
    // 3. State Mutation (Execution)
    // ==========================================

    //Executes the on-chain state changes, Safe to proceed as all security checks have passed
    pub fn process(&mut self, program_id: &Address) -> ProgramResult {
        let accounts = &self.accounts;
        let bump_array = [self.bump];

        let like_seeds = [
            Seed::from(b"like"),
            Seed::from(accounts.comment_state.address().as_ref()),
            Seed::from(accounts.user.address().as_ref()),
            Seed::from(&bump_array),
        ];
        // STEP 1:Memory Allocation
        //Request the system program to allocate sapce for LikerRecord. Uer pay the rent
        create_pda(
            accounts.user,
            accounts.like_record,
            accounts.system_program,
            LikerRecord::LEN,
            program_id,
            &like_seeds,
        )?;

        // STEP 2:Initialize LikeRecord via Zero-copy mutation.
        let mut like_data = accounts.like_record.try_borrow_mut()?;
        let like_record = LikerRecord::load_mut(&mut like_data)?;
        like_record.is_initialized = 1;
        like_record.user = accounts.user.address().clone();
        like_record.target = accounts.comment_state.address().clone();
        like_record.bump = bump_array;
        drop(like_data); //Manually drop to release the memory lock early

        //STEP:3 Updata the Post's metadata.
        let mut comment_data = accounts.comment_state.try_borrow_mut()?;
        let comment_state = CommentState::load_mut(&mut comment_data)?;

        //MATH SAFETY :Use 'check_add'to prevent u32 arithmetic over vulnerabilities.
        comment_state.likes = comment_state
            .likes
            .checked_add(1)
            .unwrap_or(comment_state.likes);
        drop(comment_data);
        Ok(())
    }
}

pub fn likecomment(data: &[u8], accounts: &[AccountView], program_id: &Address) -> ProgramResult {
    let mut like_ix = LikeComment::try_from_parts(data, accounts, program_id)?;
    like_ix.process(program_id)
}
