// src/components/post/PostCard.tsx
import React from 'react';

// 1. 严格的 TypeScript 接口：定义这块“砖”必须接收什么样的数据
export interface Post {
    id: string;
    content: string;
    likes: number;
    // 下面这三个咱们一会要在假数据里补上，让 UI 更逼真
    authorName?: string;
    authorHandle?: string;
    createdAt?: string;
}

export function PostCard({ post }: { post: Post }) {
    return (
        // 外层容器：推特经典的底部边框分割线 (border-b)，鼠标悬停变暗 (hover:bg-white/5)
        <article className="flex gap-4 p-4 border-b border-gray-800 hover:bg-white/5 transition-colors duration-200 cursor-pointer">

            {/* 左侧：头像区 (写死一个占位圆形) */}
            <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500" />
            </div>

            {/* 右侧：内容区 */}
            <div className="flex flex-col w-full">

                {/* 头部：昵称、Handle (比如 @elonmusk) 和 时间 */}
                <div className="flex items-center gap-1 text-sm">
                    <span className="font-bold text-white hover:underline">
                        {post.authorName || "匿名黑客"}
                    </span>
                    <span className="text-gray-500">
                        {post.authorHandle || "@anonymous"}
                    </span>
                    <span className="text-gray-500">·</span>
                    <span className="text-gray-500">
                        {post.createdAt || "刚刚"}
                    </span>
                </div>

                {/* 正文：推文内容 */}
                <div className="mt-1 text-white text-[15px] leading-relaxed whitespace-pre-wrap">
                    {post.content}
                </div>

                {/* 底部：交互按钮区 (评论、转发、点赞) */}
                <div className="flex items-center justify-between mt-3 text-gray-500 max-w-md">
                    {/* 评论按钮 (用简单 SVG 占位) */}
                    <button className="flex items-center gap-2 text-xs hover:text-blue-400 group transition-colors">
                        <div className="p-2 rounded-full group-hover:bg-blue-400/10">
                            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current"><g><path d="M1.751 10c0-4.42 3.582-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path></g></svg>
                        </div>
                        <span>12</span>
                    </button>

                    {/* 点赞按钮 */}
                    <button className="flex items-center gap-2 text-xs hover:text-pink-500 group transition-colors">
                        <div className="p-2 rounded-full group-hover:bg-pink-500/10">
                            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current"><g><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></g></svg>
                        </div>
                        <span>{post.likes}</span>
                    </button>
                </div>
            </div>
        </article>
    );
}