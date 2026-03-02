import {
    PublicKey,
    SystemProgram,
    TransactionInstruction,
} from '@solana/web3.js'
import { FANSPHERE_PROGRAM_ID } from '@/config/constants'
import { derivePostPDA } from './program'
import { Settled } from 'v8'
import { MailQuestionMark } from 'lucide-react'

// in Typescript use"":"is to point a return value
export function buildCreateVaultInstruction(
    maker: PublicKey,
    mint: PublicKey,
    seed: bigint,
    price: bigint,
    contentHash: Uint8Array,
): TransactionInstruction {
    if (contentHash.length !== 32) {
        throw new Error('content_hash must be exactly 32 bytes')
    }

    const data = Buffer.alloc(49)
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength)

    data[0] = 0 //the first of data is to distingquish which instruction is need

    view.setBigUint64(1, seed, true)//cut the seed
    view.setBigUint64(9, price, true)//cut the price 
    data.set(contentHash, 17)// cut the contentHash

    const [postPDA] = derivePostPDA(maker, seed)

    return new TransactionInstruction({
        keys: [
            { pubkey: maker, isSigner: true, isWritable: true },// the pubkey of super model
            { pubkey: postPDA, isSigner: false, isWritable: true },// the account of smart contract
            { pubkey: mint, isSigner: false, isWritable: false },// the address of which token maker want 
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },//the right to create a new room on the solana
        ],
        programId: FANSPHERE_PROGRAM_ID,// smart contract address
        data,
    })
}