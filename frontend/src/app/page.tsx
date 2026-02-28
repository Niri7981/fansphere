'use client';

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, Transaction, PublicKey, Connection } from '@solana/web3.js';
// ⚡️ 核心变动 1：引入你刚刚在兵工厂造好的重武器！
import { createVaultInstructions, fetchVaultData, buildCreateVaultTranscation } from '../lib/fanSphereUtil';

export default function FanSpherePage() {
  // connect to the wallet
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [price, setPrice] = useState<number>(50);
  const [currentVaultAddress, setCurrentVaultAddress] = useState<string>("");

  const handlePublish = async () => {
    if (!publicKey) return alert("请先连接钱包");
    try {
      //generate a new keypair for the vault
      const vaultkeypair = Keypair.generate();

      const transaction = await buildCreateVaultTranscation(
        connection, publicKey, vaultkeypair, price
      );


      //send the transaction
      const signature = await sendTransaction(transaction, connection, {
        signers: [vaultkeypair],
        skipPreflight: true,
      });

      console.log("✅ 发射成功！签名:", signature);
      alert(`金库创建成功！地址: ${vaultkeypair.publicKey.toBase58()}`);

      setCurrentVaultAddress(vaultkeypair.publicKey.toBase58());

    } catch (error: any) {
      console.error("❌ 抓到异常了！");

      // 重点：如果报错里带了 logs，直接打印出来！
      if (error.logs) {
        console.log("📜 --- 真正的 Rust 日志在这里 ---");
        error.logs.forEach((log: string) => console.log(log));
      } else {
        // 如果没 logs，把整个错误对象打印出来，我们在控制台点开找
        console.log("📂 完整错误对象:", error);
      }

      alert("发射失败！快去 F12 控制台看那串 'Program log'！");
    };
  }


  // 极简但赛博朋克的 UI 渲染
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white p-6 font-sans selection:bg-purple-500/30">
      {/* 顶部背景装饰：赛博光晕 */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />
      </div>

      {/* 状态栏：右上角钱包状态 */}
      <div className="fixed top-6 right-6 flex items-center space-x-3 bg-white/5 border border-white/10 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl">
        <div className={`w-2 h-2 rounded-full ${publicKey ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
        <span className="text-xs font-medium tracking-widest text-gray-400 uppercase">
          {publicKey ? `Connected: ${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : 'Wallet Disconnected'}
        </span>
      </div>

      {/* 主操作区 */}
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
            FanSphere
          </h1>
          <div className="flex items-center justify-center space-x-2">
            <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-purple-500" />
            <p className="text-[10px] tracking-[0.3em] text-purple-400 font-bold uppercase">Zero-Copy Content Protocol</p>
            <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-purple-500" />
          </div>
        </div>

        <div className="relative group">
          {/* 卡片背光 */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />

          <div className="relative bg-[#0A0A0A] border border-white/10 p-8 rounded-3xl shadow-2xl space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold ml-1">
                Vault Unlock Price (Tokens)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-black/50 border border-white/5 rounded-2xl px-6 py-5 text-2xl font-mono text-purple-400 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                  placeholder="0.00"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600 font-mono text-sm">FAN</div>
              </div>
            </div>

            <button
              onClick={handlePublish}
              disabled={!publicKey}
              className="group relative w-full overflow-hidden rounded-2xl bg-white px-8 py-5 text-black font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 w-3 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              <span className="relative flex items-center justify-center space-x-2">
                <span>GENESIS DEPLOY</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
            </button>

            <p className="text-[10px] text-center text-gray-600 leading-relaxed">
              By deploying, you are initializing a <span className="text-gray-400">41-byte</span> state on the Solana Devnet. <br />
              Data is persisted via the <span className="text-gray-400">FanSphere Program</span>.
              {currentVaultAddress && (
                <button
                  // 🌟 重点在这里：变成一个 async 函数，接住返回值，然后弹窗！
                  onClick={async () => {
                    console.log("👉 正在呼叫工具箱...");

                    // 1. 等待工具箱把翻译好的 50 传回来
                    const price = await fetchVaultData(currentVaultAddress);

                    console.log("👉 工具箱传回的数字是:", price);

                    // 2. 只要拿到了数字，立刻用弹窗砸脸！
                    if (price !== null && price !== undefined) {
                      alert(`🎉 卧槽！链上数据破解成功！\n\n金库里的真实金额是：${price} FAN Tokens！`);
                    } else {
                      alert("❌ 没拿到数据，快去控制台看看是不是写错了！");
                    }
                  }}
                  className="mt-4 px-4 py-2 bg-green-500 text-white font-bold rounded"
                >
                  读取并验证链上数据 🔍
                </button>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

}