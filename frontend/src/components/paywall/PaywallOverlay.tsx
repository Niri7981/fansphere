// src/components/paywall/PaywallOverlay.tsx
import React from 'react';

export function PaywallOverlay() {
    return (
        // absolute 绝对定位：像幽灵一样漂浮在推文正文的上方
        // bg-gradient-to-t: 从底部的纯黑，向上渐变到透明
        // backdrop-blur-md: 核心魔法！底部的字会被高斯模糊掉！
        <div className="absolute bottom-0 left-0 w-full h-3/4 bg-gradient-to-t from-black via-black/80 to-transparent backdrop-blur-sm z-10 flex flex-col justify-end items-center pb-6">

            {/* 一个带闪烁动画的小锁头提示 */}
            <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/20 backdrop-blur-md">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
                <span className="text-sm font-bold tracking-wider">该内容已被创作者锁定</span>
            </div>

        </div>
    );
}