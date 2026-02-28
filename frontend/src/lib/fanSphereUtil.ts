import { SystemProgram, TransactionInstruction, Keypair, PublicKey, Connection, Transaction } from "@solana/web3.js";
import { FANSPHERE_PROGRAM_ID, VAULT_SPACE } from "../config/constants";
import { Key } from "react";

//
export const createVaultInstructions = async (
    connection: Connection,
    makerPubkey: PublicKey,
    price: number,
    vaultKeypair: Keypair,
) => {

    const dataBuffer = Buffer.alloc(9);
    dataBuffer.writeUInt8(0, 0);
    // ⚡️ 核心突围：使用浏览器原生 DataView 绕过假 Buffer 的坑

    const dataView = new DataView(dataBuffer.buffer, dataBuffer.byteOffset, dataBuffer.byteLength);
    dataView.setBigUint64(1, BigInt(price), true);


    const rentlamports = await connection.getMinimumBalanceForRentExemption(VAULT_SPACE);

    const createAccIx = SystemProgram.createAccount({
        fromPubkey: makerPubkey,
        newAccountPubkey: vaultKeypair.publicKey,
        lamports: rentlamports,
        space: VAULT_SPACE,
        programId: FANSPHERE_PROGRAM_ID,
    });

    const initVaultIx = new TransactionInstruction({
        keys: [
            { pubkey: vaultKeypair.publicKey, isSigner: true, isWritable: true },
            { pubkey: makerPubkey, isSigner: true, isWritable: true }
        ],
        programId: FANSPHERE_PROGRAM_ID,
        data: dataBuffer,
    });

    return [createAccIx, initVaultIx];
}

export async function fetchVaultData(vaultAddressString: string) {
    try {
        //connect to  the locol net
        const connection = new Connection("http://127.0.0.1:8899", "confirmed");
        //find the vault address
        const vaultAddress = new PublicKey(vaultAddressString);

        console.log(`正在强行撬开金库: ${vaultAddressString} ...`);
        console.log("正在强行撬开金库...");
        //
        const accountInfo = await connection.getAccountInfo(vaultAddress);

        if (accountInfo == null) {
            console.error("金库是空的！是不是找错地址了？");
            return;
        }
        console.log("拿到了！原始的 48 字节长这样：", accountInfo.data);

        // read the data 
        const data = accountInfo.data;
        //find the location of 50 byte in this 48 bytes array
        const priceIndex = data.findIndex(byte => byte === 50);
        //prepare a wallet to deposit price
        let decondedPrice = 0;
        if (priceIndex != -1) {
            decondedPrice = data[priceIndex];
        } else {
            decondedPrice = data[0];
        }

        return decondedPrice;
    } catch (error) {
        console.error("读取链上数据时翻车了：", error);
        return null;

    }
}



export async function buildCreateVaultTranscation(
    connection: Connection,
    publicKey: PublicKey,
    vaultKeypair: Keypair,
    price: number
) {
    const instruction = await createVaultInstructions(
        connection,
        publicKey,
        price,
        vaultKeypair
    );
    const transaction = new Transaction().add(...instruction);

    const latestBlockhash = await connection.getLatestBlockhash();
    transaction.recentBlockhash = latestBlockhash.blockhash;


    transaction.feePayer = publicKey;
    return transaction;
}

