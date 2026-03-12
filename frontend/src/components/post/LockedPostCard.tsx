'use client';
import React from 'react';
import { PostCard } from './PostCard';

export function LockedPostCard({ post }: { post: any }) {
    const isLocked = post.likes > 500;

    if (!isLocked) {
        return <PostCard post={post} />;
    }

    return (
        // 【最外层大盒子】：和 PostCard 保持绝对一致！纯黑！无边框！
        <div className="w-full py-4">

            {/* 头部区域：一模一样的 flex 排版 */}
            <div className="flex items-center px-4 mb-3 gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex-shrink-0"></div>
                <div className="flex flex-col">
                    <span className="font-bold text-white text-[15px]">{post.authorName}</span>
                    <span className="text-gray-500 text-[13px]">@{post.authorHandle} · 独家内容</span>
                </div>
            </div>

            {/* 【核心修改：OnlyFans 锁定框】 */}
            {/* px-4 (让锁定框和文字左右对齐) */}
            <div className="px-4 mt-2">
                {/* 锁定框本体盒子：
                    bg-[#1b1e25] (极其微弱的深灰蓝，用来和纯黑背景区分),
                    rounded-2xl (大圆角), 
                    🚨 绝对不要加 border，让色块自己形成分割！
                */}
                <div className="w-full bg-[#1b1e25] rounded-2xl py-12 flex flex-col items-center justify-center">

                    {/* 小锁图标和提示词 */}
                    <div className="text-gray-400 mb-4 text-sm flex items-center gap-2">
                        🔒 包含独家照片与视频连载
                    </div>

                    {/* CTA 按钮盒子 */}
                    <button className="bg-[#00AFF0] text-white font-bold py-3 px-8 rounded-full">
                        订阅以查看用户的帖子
                    </button>

                    <span className="text-gray-500 text-xs mt-3">解锁价格: 5 USDC / 月</span>
                </div>
            </div>

        </div>
    );
}