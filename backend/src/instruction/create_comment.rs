use pinocchio::{cpi::Seed, error::ProgramError, AccountView, Address, ProgramResult};

use crate::{helper::create_pda, CommentState, PostState};

pub struct CreateCommentData {
    pub comment_index: u32, //the location of current comment under the root node
    pub content_hash: [u8; 32],
    pub depth: u8,
}

impl CreateCommentData {
    pub fn try_from_bytes(data: &[u8]) -> Result<Self, ProgramError> {
        if data.len() != 38 {
            return Err(ProgramError::InvalidInstructionData);
        }

        let comment_index = u32::from_le_bytes(data[1..5].try_into().unwrap());
        let content_hash: [u8; 32] = data[5..37].try_into().unwrap();
        let depth = data[37];

        Ok(Self {
            comment_index,
            content_hash,
            depth,
        })
    }
}

pub struct CreateCommentAccounts<'a> {
    pub author: &'a AccountView,
    pub post_state: &'a AccountView,
    pub comment_state: &'a AccountView,
    pub parent: &'a AccountView,
    pub subscription_record: &'a AccountView,
    pub system_program: &'a AccountView,
}

impl<'a> CreateCommentAccounts<'a> {
    pub fn try_from_bytes(accounts: &'a [AccountView]) -> Result<Self, ProgramError> {
        if accounts.len() < 6 {
            return Err(ProgramError::InvalidInstructionData);
        }
        let author = &accounts[0];
        if !author.is_signer() {
            return Err(ProgramError::MissingRequiredSignature);
        }

        let post_state = &accounts[1];
        let comment_state = &accounts[2];
        let parent = &accounts[3];
        let subscription_record = &accounts[4];
        let system_program = &accounts[5];

        Ok(Self {
            author,
            post_state,
            comment_state,
            subscription_record,
            parent,
            system_program,
        })
    }
}

pub struct CreateComment<'a> {
    pub parsed_accounts: CreateCommentAccounts<'a>,
    pub args: CreateCommentData,
    bump: u8,
}

impl<'a> CreateComment<'a> {
    pub fn try_from_parts(
        data: &[u8],
        accounts: &'a [AccountView],
        program_id: &Address,
    ) -> Result<Self, ProgramError> {
        let parsed_accounts = CreateCommentAccounts::try_from_bytes(accounts)?;

        if data[0] != 0x02 {
            return Err(ProgramError::InvalidInstructionData);
        }
        let args = CreateCommentData::try_from_bytes(data)?;

        let post_data_ref = parsed_accounts.post_state.try_borrow()?;
        let post_state = PostState::load(&post_data_ref)?;

        if post_state.is_private == 1 && parsed_accounts.subscription_record.data_len() == 0 {
            return Err(ProgramError::MissingRequiredSignature);
        }

        drop(post_data_ref);

        let (expected_pda, bump) = Address::find_program_address(
            &[
                b"comment",
                parsed_accounts.parent.address().as_ref(),
                &args.comment_index.to_le_bytes(),
            ],
            program_id,
        );

        if parsed_accounts.comment_state.address() != &expected_pda {
            return Err(ProgramError::InvalidAccountData);
        }
        Ok(Self {
            parsed_accounts,
            args,
            bump,
        })
    }

    pub fn process(&mut self, program_id: &Address) -> ProgramResult {
        let accounts = &self.parsed_accounts;
        let args = &self.args;
        let bump_array = [self.bump];

        let binding = args.comment_index.to_le_bytes();
        let comment_seeds = [
            Seed::from(b"comment"),
            Seed::from(accounts.parent.address().as_ref()),
            Seed::from(&binding),
            Seed::from(&bump_array),
        ];

        create_pda(
            accounts.author,
            accounts.comment_state,
            accounts.system_program,
            CommentState::LEN,
            program_id,
            &comment_seeds,
        )?;

        let mut comment_data = self.parsed_accounts.comment_state.try_borrow_mut()?;
        let comment_state = CommentState::load_mut(&mut comment_data)?;

        comment_state.is_initialized = 1;
        comment_state.author = self.parsed_accounts.author.address().clone();
        comment_state.content_hash = self.args.content_hash;
        comment_state.index = self.args.comment_index;
        comment_state.likes = 0;
        comment_state.reply_count = 0;
        comment_state.bump = [self.bump];

        if args.depth == 0 {
            comment_state.parent = accounts.post_state.address().clone();
        } else {
            comment_state.parent = accounts.parent.address().clone();
        }
        drop(comment_data);

        let mut post_data = self.parsed_accounts.post_state.try_borrow_mut()?;
        let post_state = PostState::load_mut(&mut post_data)?;

        post_state.comments_count += 1;

        drop(post_data);
        Ok(())
    }
}
