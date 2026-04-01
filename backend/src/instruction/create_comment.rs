use pinocchio::{cpi::Seed, error::ProgramError, AccountView, Address, ProgramResult};

use crate::{helper::create_pda, CommentState, PostState, SubscriptionRecord};

const SYSVAR_CLOCK_PUBKEY: [u8; 32] = [
    6, 161, 216, 23, 203, 226, 45, 114, 184, 15, 12, 126, 241, 14, 43, 237, 246, 222, 172, 85, 23,
    118, 59, 147, 51, 80, 201, 196, 0, 0, 0, 0,
];

pub struct CreateCommentData {
    pub comment_index: u32, //the location of current comment under the root node
    pub content_hash: [u8; 64],
    pub depth: u8,
}

impl CreateCommentData {
    pub fn try_from_bytes(data: &[u8]) -> Result<Self, ProgramError> {
        if data.len() != 70 {
            return Err(ProgramError::InvalidInstructionData);
        }

        let comment_index = u32::from_le_bytes(data[1..5].try_into().unwrap());
        let content_hash: [u8; 64] = data[5..69].try_into().unwrap();
        let depth = data[69];

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
    pub clock: &'a AccountView,
}

impl<'a> CreateCommentAccounts<'a> {
    pub fn try_from_bytes(accounts: &'a [AccountView]) -> Result<Self, ProgramError> {
        if accounts.len() < 7 {
            return Err(ProgramError::NotEnoughAccountKeys);
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
        let clock = &accounts[6];

        Ok(Self {
            author,
            post_state,
            comment_state,
            subscription_record,
            parent,
            system_program,
            clock,
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

        if data[0] != 0x03 {
            return Err(ProgramError::InvalidInstructionData);
        }
        let args = CreateCommentData::try_from_bytes(data)?;

        let post_data_ref = parsed_accounts.post_state.try_borrow()?;
        let post_state = PostState::load(&post_data_ref)?;

        if post_state.is_private == 1
            && parsed_accounts.author.address() != &post_state.maker
            && parsed_accounts.subscription_record.data_len() == 0
        {
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

        if accounts.clock.address().as_ref() != SYSVAR_CLOCK_PUBKEY {
            return Err(ProgramError::InvalidAccountData); // 假时钟直接踢飞
        }
        let clock_data = accounts.clock.try_borrow()?;
        if clock_data.len() < 40 {
            return Err(ProgramError::InvalidAccountData);
        }
        // UnixTimestamp 在 Clock 账户数据的 32 到 40 字节
        let current_timestamp = i64::from_le_bytes(clock_data[32..40].try_into().unwrap());
        drop(clock_data); // 读完赶紧放手，别占着内存

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
        comment_state.post = accounts.post_state.address().clone();
        comment_state.content_hash = self.args.content_hash;
        comment_state.index = self.args.comment_index;
        comment_state.created_at = current_timestamp;
        comment_state.likes = 0;
        comment_state.reply_count = 0;
        comment_state.bump = [self.bump];

        if args.depth == 0 {
            if accounts.parent.address() != accounts.post_state.address() {
            return Err(ProgramError::InvalidAccountData); // 敢骗我？滚！
        }
            comment_state.parent = accounts.post_state.address().clone();
        } else {
            let parent_data = accounts.parent.try_borrow()?;
            let parent_state = CommentState::load(&parent_data)?;

            if parent_state.is_initialized != 1 {
                return Err(ProgramError::InvalidAccountData);
            }
            // 验证 parent 评论是否确实属于这个 post，防止跨贴回复
            if parent_state.post != *accounts.post_state.address() {
                return Err(ProgramError::InvalidAccountData);
            };

            comment_state.parent = accounts.parent.address().clone();
        }
        drop(comment_data);

        let mut post_data = self.parsed_accounts.post_state.try_borrow_mut()?;
        let post_state = PostState::load_mut(&mut post_data)?;

        if post_state.is_private == 1  && accounts.author.address() != &post_state.maker{
            let (expected_sub_pda, _) = Address::find_program_address(
                &[
                    b"subscription", // 或者你在 deriveSubscriptionPDA 里用的前缀，请保持一致
                    post_state.maker.as_ref(), // creator
                    accounts.author.address().as_ref(), // subscriber
                ],
                program_id,
            );
            if accounts.subscription_record.address() != &expected_sub_pda {
                return Err(ProgramError::InvalidAccountData);
            }

            let sub_data = accounts.subscription_record.try_borrow()?;
            let sub_record = SubscriptionRecord::load(&sub_data)?;

            // 💥 关键：不仅要 data_len > 0，还要验证它是初始化的，且没过期！
            // 还要验证它的 creator 是否匹配当前帖子的作者！
            if sub_record.is_initialized != 1 || 
               sub_record.creator != post_state.maker ||
               sub_record.subscriber != *accounts.author.address() || // 💥 修复1的核心！
               sub_record.expires_at <= current_timestamp {
                return Err(ProgramError::InvalidAccountData);
            }
        }
        
        post_state.comments_count += 1;
        drop(post_data);
        Ok(())
    }
}

pub fn createcomment(data: &[u8], accounts: &[AccountView], program_id: &Address) -> ProgramResult {
    let mut make_ix = CreateComment::try_from_parts(data, accounts, program_id)?;
    make_ix.process(program_id)
}
