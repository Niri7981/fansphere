// [TODO 1]: 极其重要！告诉 Next.js 这是浏览器组件
'use client';

import React from 'react';
// [TODO 2]: 引入咱们自己昨天写的神级机械臂（别再让 VS Code 乱导 crypto 了！）
import { useSign } from '@/hooks/useSignIn';

export function SiwsButton() {
    // [TODO 3]: 激活机械臂，把里面的 3 件法宝解构出来
    const { signIn, isLoading, error } = useSign();

    return (
        <div className="flex flex-col items-center gap-2 mt-8">
            <button
                // [TODO 4.1]: 绑定点击事件。注意是 onClick={动作变量}
                onClick={signIn}

                // [TODO 4.2]: 防御机制。如果 isLoading 是 true，这个按钮就会被锁死
                disabled={isLoading}

                // Tailwind CSS 魔法：动态切换背景色
                className={`
                    px-6 py-3 rounded-lg font-bold text-white transition-all
                    ${isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 active:scale-95'}
                `}
            >
                {/* [TODO 4.3]: 根据状态显示不同文字。在 HTML 里写 JS 逻辑，必须用 {} 包起来 */}
                {isLoading ? 'Signing In...' : 'Sign In with Solana'}
            </button>

            {/* [TODO 5]: 错误播报器。如果 error 有内容，就画出下面的红字；如果是 null，就什么都不画 */}
            {error && (
                <p className="text-red-500 text-sm mt-2 font-medium">
                    {error}
                </p>
            )}
        </div>
    );
}