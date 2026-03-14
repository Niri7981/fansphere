import { transactionService } from "@/services/transaction.service";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, SystemInstruction, SystemProgram, Keypair } from "@solana/web3.js";
import { useUnlockPost } from "./useUnlockPost";
import { useState } from "react";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { createSubscription } from "@/services/instruction.service";
import { deriveProfilePDA } from "@/lib/pda";
import { USDC_MINT_ADDRESS } from '@/config/constants';

export function useSubscription() {
    const { connection } = useConnection();
    const { publicKey, signTransaction } = useWallet();
    const { startUnlockingPolling } = useUnlockPost();
    //信号灯与信号灯开关
    const [isSubscribing, setIsSubscribing] = useState(false);

    const subscribe = async (creatorId: string, price: number) => {
        if (!signTransaction || !publicKey) {
            alert('兄弟，先去右上角连个钱包！');
            return;
        }
        try {
            setIsSubscribing(true);


            const creatorPubkey = new PublicKey("HXvqH3weDKJaVnvwVkN5MRPB28LGgoGYAmB5h4f6c9FU");
            // 假设你有 USDC_MINT_ADDRESS 常量
            const subscriberTokenAccount = await getAssociatedTokenAddress(USDC_MINT_ADDRESS, publicKey);
            const creatorTokenAccount = await getAssociatedTokenAddress(USDC_MINT_ADDRESS, creatorPubkey);


            const subscriber_mint = Keypair.generate().publicKey;
            const subscriber_nft_account = await getAssociatedTokenAddress(subscriber_mint, publicKey);

            const [creatorProfilePda] = deriveProfilePDA(creatorPubkey);

            const realSubscriptionIx = createSubscription(
                BigInt(Date.now() + 30 * 24 * 60 * 60 * 1000), // 过期时间：30天后
                creatorPubkey,
                publicKey,
                creatorProfilePda, // 你算出来的
                subscriberTokenAccount,
                creatorTokenAccount,
                subscriber_nft_account,
                subscriber_mint,
            )

            const signature = await transactionService.sendAndConfirmTx(
                connection,
                { publicKey, signTransaction },
                [realSubscriptionIx],
            );
            alert(`付款成功！流水号: ${signature}`);

            await startUnlockingPolling("临时测试的帖子PDA地址", signature);

        } catch (error: any) {
            alert(`报错啦: ${error.message}`)
        } finally {
            setIsSubscribing(false);
        }
    };
    return { subscribe, isSubscribing };
}