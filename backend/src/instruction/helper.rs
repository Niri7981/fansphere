use pinocchio::{
    cpi::{Seed, Signer},
    error::ProgramError,
    sysvars::{rent::Rent, Sysvar},
    AccountView, Address,
};
use pinocchio_system::instructions::CreateAccount;

// create FanSphere PDA
#[inline(always)]
pub fn create_pda<'a>(
    payer: &'a AccountView,           // 谁掏钱付矿工费 (超模)
    new_pda: &'a AccountView,         // 要建的 PDA 账号 (金库)
    _system_program: &'a AccountView, // 建委大管家
    space: usize,                     // 房子要多大 (比如咱们的 PostState::LEN)
    program_id: &Address,             // 房产证上盖谁的章 (合约 ID)
    seeds: &[Seed],
) -> Result<(), ProgramError> {
    let lamports = Rent::get()?.try_minimum_balance(space)?;
    let signers = [Signer::from(seeds)];
    CreateAccount {
        from: payer,
        to: new_pda,
        lamports,
        space: space as u64,
        owner: program_id,
    }
    .invoke_signed(&signers)
}
