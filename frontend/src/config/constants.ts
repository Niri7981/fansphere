// src/config/constants.ts
import { PublicKey } from "@solana/web3.js";

// 你的智能合约唯一身份证
export const FANSPHERE_PROGRAM_ID = new PublicKey("2maVZnfpRWE95P4zhrZPasUiDsMoxk7cxDtTMWb7N6u7");

// 动态计算出的地皮大小 (1字节状态 + 32字节地址 + 8字节价格)
export const VAULT_SPACE = 114; 