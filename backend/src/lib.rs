#![no_std]

use pinocchio::{
    entrypoint, error::ProgramError, nostd_panic_handler, AccountView, Address, ProgramResult,
};

pub mod instruction;
pub mod state;
use crate::instruction::{
    create_comment::createcomment, create_post::createvault, create_profile::createprofile,
    like_comment::likecomment, like_post::likepost, subscribe::createsubscribe,
};
pub use instruction::*;
pub use state::*;

entrypoint!(process_instruction);
nostd_panic_handler!();

pub fn process_instruction(
    program_id: &Address,
    accounts: &[AccountView],
    instruction_data: &[u8], //Accept dynamic slice from VM,length is unkown at complie time
) -> ProgramResult {
    let (&discriminator, _rest_data) = instruction_data
        .split_first()
        .ok_or(ProgramError::InvalidInstructionData)?;

    match discriminator {
        0 => createprofile(instruction_data, accounts, program_id),
        1 => createvault(instruction_data, accounts, program_id),
        2 => likepost(instruction_data, accounts, program_id),
        3 => createcomment(instruction_data, accounts, program_id),
        4 => createsubscribe(instruction_data, accounts, program_id),
        5 => likecomment(instruction_data, accounts, program_id),
        _ => Err(ProgramError::InvalidInstructionData),
    }
}
