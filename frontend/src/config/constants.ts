// src/config/constants.ts
import { PublicKey } from "@solana/web3.js";

// 你的智能合约唯一身份证
export const FANSPHERE_PROGRAM_ID = new PublicKey("2maVZnfpRWE95P4zhrZPasUiDsMoxk7cxDtTMWb7N6u7");


export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
export const ARWEAVE_GATEWAY = "https://arweave.net";


export const SEED_PROFILE = Buffer.from("profile");
export const SEED_POST = Buffer.from("post");
export const SEED_SUBSCRIPTION = Buffer.from("subscription");
export const SEED_LIKE = Buffer.from("like");
export const SEED_COMMENT = Buffer.from("comment");
//export const SEED_REPLY = Buffer.from("reply");
