import { transactionService } from "@/services/transaction.service";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, SystemInstruction, SystemProgram } from "@solana/web3.js";
import { useState } from "react";

export function useSubscription() {
    const { connection } = useConnection();
    const { publicKey, signTransaction } = useWallet();

    //信号灯与信号灯开关
    const [isSubscribing, setIsSubscribing] = useState(false);

    const subscribe = async (creator: string, price: number) => {
        if (!signTransaction || !publicKey) {
            alert('兄弟，先去右上角连个钱包！');
            return;
        }
        try {
            setIsSubscribing(true);
            const receiveAddress = new PublicKey("11111111111111111111111111111111")

            const transferIx = SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: receiveAddress,
                lamports: 0.01 * LAMPORTS_PER_SOL
            });

            const signature = await transactionService.sendAndConfirmTx(
                connection,
                { publicKey, signTransaction },
                [transferIx],
            );
            alert(`付款成功！流水号: ${signature}`);

        } catch (error: any) {
            alert(`报错啦: ${error.message}`)
        } finally {
            setIsSubscribing(false);
        }
    };
    return { subscribe, isSubscribing };
}