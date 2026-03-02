'use client';

import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { buildCreateVaultInstruction } from '@/lib/fanSphereUtil';

export default function TestPage() {
  const handleTest = async () => {
    try {
      // 1. 建立连接
      const connection = new Connection('http://127.0.0.1:8899', 'confirmed');

      // 2. 生成假账号
      const maker = Keypair.generate();
      console.log('👤 Maker 公钥:', maker.publicKey.toBase58());

      // 3. 申请空投并等待确认
      const airdropSig = await connection.requestAirdrop(
        maker.publicKey,
        1_000_000_000,
      );
      await connection.confirmTransaction(airdropSig, 'confirmed');
      console.log('💰 空投确认完成！');

      // 4. 构造参数 & 打包指令
      const contentHash = new Uint8Array(32).fill(1);
      const ix = buildCreateVaultInstruction(
        maker.publicKey,
        SystemProgram.programId,
        BigInt(888),
        BigInt(50),
        contentHash,
      );

      // 5. 把指令塞进 Transaction
      const tx = new Transaction().add(ix);

      // 6. 签名上链
      const signature = await sendAndConfirmTransaction(connection, tx, [maker]);

      // 7. 成功反馈
      console.log('%c✅ Transaction Signature: ' + signature, 'color: green; font-weight: bold');
      alert(`🎉 发射成功！\nSignature: ${signature}`);

    } catch (error) {
      console.error('%c❌ 发射失败！详细 Error:', 'color: red; font-weight: bold', error);
      alert('💥 发射失败！快去 F12 控制台看红色错误！');
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <button
        onClick={handleTest}
        className="text-4xl font-black px-16 py-8 bg-white text-black rounded-3xl hover:scale-105 active:scale-95 transition-transform shadow-2xl"
      >
        发射测试核弹 🚀
      </button>
    </div>
  );
}