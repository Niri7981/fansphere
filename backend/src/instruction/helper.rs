use pinocchio::{
    cpi::{Seed, Signer},
    error::ProgramError,
    sysvars::{rent::Rent, Sysvar},
    AccountView, Address,
};
use pinocchio_system::instructions::CreateAccount;

// 💥 重构：将局限的 program_id 升级为泛型的 owner
#[inline(always)]
pub fn create_pda<'a>(
    payer: &'a AccountView,           // 掏钱付矿工费的账户 (Signer)
    new_pda: &'a AccountView,         // 要分配空间的新 PDA 账户 (金库)
    _system_program: &'a AccountView, // 建委大管家
    space: usize,                     // 房子要多大 (比如 82 字节或 Profile::LEN)
    owner: &Address,                  // 💥 房产证上盖谁的章 (归属哪个 Program)
    seeds: &[Seed],                   // PDA 派生种子
) -> Result<(), ProgramError> {
    // 计算免租金所需的最低 Lamports
    let lamports = Rent::get()?.try_minimum_balance(space)?;

    // 组装签名
    let signers = [Signer::from(seeds)];

    // 调用系统程序开辟空间并移交所有权
    CreateAccount {
        from: payer,
        to: new_pda,
        lamports,
        space: space as u64,
        owner, // 💥 动态指定 owner，彻底解耦
    }
    .invoke_signed(&signers)
}
