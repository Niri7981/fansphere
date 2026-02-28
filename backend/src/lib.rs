#![no_std]

use pinocchio::{
    entrypoint, error::ProgramError, nostd_panic_handler, AccountView, Address, ProgramResult,
};

use crate::instruction::create;

pub mod instruction;
pub mod state;
entrypoint!(process_instruction);
nostd_panic_handler!();

pub fn process_instruction(
    _program_id: &Address,
    _accounts: &[AccountView],
    instruction_data: &[u8], //Accept dynamic slice from VM,length is unkown at complie time
) -> ProgramResult {
    //Sanity check.if length of instruction less than nine bytes Error
    if instruction_data.len() < 9 {
        return Err(ProgramError::InvalidInstructionData);
    }

    //find the first of byte to distinguish what instruction
    let (discriminantor, _rest) = instruction_data.split_first().unwrap();
    //match the disctiminatior to clarity what to do
    match discriminantor {
        0 => create::create(_accounts, instruction_data),

        _ => Err(ProgramError::InvalidInstructionData),
    }
}
