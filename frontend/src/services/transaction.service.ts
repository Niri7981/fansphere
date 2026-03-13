import { Connection, sendAndConfirmTransaction, Transaction, TransactionInstruction } from '@solana/web3.js';


export const transactionService = {
    async sendAndConfirmTx(
        connect: Connection,
        wallet: any,
        instructions: TransactionInstruction[]
    ) {
        try {
            // 1. 检查钱包在不在
            if (!wallet.key) throw new Error('NO CONNECTION WITH WALLET');
            // 2. 拿个空纸箱
            const transaction = new Transaction();
            // 3.把事情装进纸箱
            instructions.forEach((ix) => transaction.add(ix));
            // 4.获取最新的区块链路况凭证
            const latestBlockhash = await connect.getLatestBlockhash();
            transaction.feePayer = wallet.publicKey;
            transaction.recentBlockhash = latestBlockhash.blockhash;
            // 5. 呼叫 Phantom 钱包，让用户按指纹（签名）！
            const signedTx = await wallet.signTransaction(transaction);
            // 6. 扔上链！
            const signature = await connect.sendRawTransaction(signedTx.serialize());
            // 7. 死死盯着这笔交易，直到全网确认它成功
            const confirmation = await connect.confirmTransaction({
                signature: signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            });
            if (confirmation.value.err) {
                throw new Error('链上确认失败，钱没扣！');
            }
            return signature;
        } catch (error: any) {
            console.error('❌ 交易失败：', error.message);
            if (error.message.includes('User rejected')) {
                throw new Error('你取消了支付');
            }
            throw error;
        }
    }
};