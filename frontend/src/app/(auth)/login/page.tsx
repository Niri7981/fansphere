'use client';

import { SiwsButton } from '@/components/auth/SiwsButton';

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4 relative overflow-hidden">

            {/* 背景氛围灯：用 Tailwind 画的两个发光大圆球 */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none"></div>

            {/* 核心登录卡片 */}
            <div className="w-full max-w-md p-10 space-y-8 bg-white/5 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl z-10">
                <div className="text-center">
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                        FanSphere
                    </h1>
                    <p className="mt-4 text-gray-400 font-medium">
                        连接 Phantom 钱包，开启 Web3 创作者引擎
                    </p>
                </div>

                <div className="flex justify-center pt-4">
                    {/* 咱们的终极点火按钮 */}
                    <SiwsButton />
                </div>
            </div>

        </div>
    );
}