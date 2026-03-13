import React from 'react';

export function PostCard({ post }: { post: any }) {
    return (
        // 【最外层的大盒子】：
        // w-full (撑满宽度), bg-black (必须是纯黑，融入背景), 
        // py-4 (上下垫一层海绵，不让帖子太挤)
        // 🚨 注意：这里绝对不能有任何 border！
        <div className="w-full py-4">

            {/* 【第一层小盒子：头部区域】 */}
            {/* flex (左右横排), items-center (垂直居中), gap-3 (头像和名字中间空出距离) */}
            <div className="flex items-center px-4 mb-3 gap-3">
                {/* 头像盒子 */}
                <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0"></div>
                {/* 名字和账号盒子 (flex-col 上下排布) */}
                <div className="flex flex-col">
                    <span className="font-bold text-white text-[15px]">{post.authorName}</span>
                    <span className="text-gray-500 text-[13px]">@{post.authorHandle} · 2小时前</span>
                </div>
            </div>

            {/* 【第二层小盒子：正文内容】 */}
            {/* px-4 (左右塞海绵，和头像对齐) */}
            <div className="px-4 text-white text-[15px] leading-relaxed mb-3">
                {post.content}
            </div>

            {/* 【第三层小盒子：互动底栏】 */}
            <div className="px-4 text-gray-500 text-sm">
                ♥ {post.likes} 次点赞
            </div>

        </div>
    );
}