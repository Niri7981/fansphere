import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { AuthManager, createSignInMessage, generateNonce } from '@/services/auth.service';

export function useSign() {
    const { publicKey, signMessage } = useWallet(); // 这是 Solana 官方提供的 Hook，用来掏出用户的钱包
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const signIn = async () => {
        try {
            setIsLoading(true);
            setError(null);
            // 第一关：安检！
            if (!signMessage || !publicKey) {
                throw new Error("PLEASE CONNECT TO THE WALLET")
            }
            // 第一关：安检！
            if (!publicKey || !signMessage) {
                throw new Error('请先连接钱包！');
            }

            // 第二关：起草信件
            const nonce = generateNonce();
            const messageString = createSignInMessage(publicKey.toBase58(), nonce);

            // 第三关：编码与签字（极其重要！）
            // 钱包不认识字符串，只认识字节（Uint8Array）。所以咱们得把英文信件转成字节。
            const messageBytes = new TextEncoder().encode(messageString);

            // 🚨 唤醒 Phantom 钱包！程序会在这里卡住，直到用户点 Approve 或者 Reject
            const signatureBytes = await signMessage(messageBytes);

            // 第四关：翻译签名
            // 把钱包吐出来的字节签名，转成 Base58 字符串，准备发给后端
            const signatureBase58 = bs58.encode(signatureBytes);

            // 第五关：向后端发起进攻（换取 JWT）
            // ⚠️ 注意：咱们目前还没有写后端的登录接口，所以这里先用注释代替！
            // const response = await fetch('/api/auth/login', {
            //     method: 'POST',
            //     body: JSON.stringify({
            //         publicKey: publicKey.toBase58(),
            //         signature: signatureBase58,
            //         nonce: nonce
            //     })
            // });
            // const { token } = await response.json();

            // 💥 模拟后端返回了一个假 Token（临时测试用，以后换成真的）
            const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...模拟Token";

            // 第六关：存入抽屉
            AuthManager.setToken(fakeToken);

            console.log("登录大成功！签名是：", signatureBase58);
            return true;

        } catch (err: any) {
            console.error("登录失败:", err);
            // 捕获用户拒绝签名等错误
            setError(err.message || '登录过程中发生错误');
            return false;
        } finally {
            setIsLoading(false);
        }
    };
    return { signIn, isLoading, error };
}