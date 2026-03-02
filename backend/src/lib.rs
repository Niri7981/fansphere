#![no_std]

use pinocchio::{
    entrypoint, error::ProgramError, nostd_panic_handler, AccountView, Address, ProgramResult,
};

pub mod instruction;
pub mod state;
use crate::create_post::createvault;
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
        0 => createvault(instruction_data, accounts, program_id),

        _ => Err(ProgramError::InvalidInstructionData),
    }
}
