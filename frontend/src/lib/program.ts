import { PublicKey } from '@solana/web3.js'
import { FANSPHERE_PROGRAM_ID } from '@/config/constants'

export function derivePostPDA(maker: PublicKey, seed: bigint): [PublicKey, number] {
    const seedBuffer = Buffer.alloc(8)
    const view = new DataView(seedBuffer.buffer)
    view.setBigUint64(0, seed, true) // little-endian

    return PublicKey.findProgramAddressSync(
        [Buffer.from('post'), maker.toBuffer(), seedBuffer],
        FANSPHERE_PROGRAM_ID
    )
}