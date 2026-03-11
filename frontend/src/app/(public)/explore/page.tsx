// src/app/(public)/explore/page.tsx

import { PostFeed } from "@/components/post/PostFeed";

export default function ExplorePage() {
    return (
        // 外层容器：居中对齐、最大宽度限制、左右加上推特经典的灰色边框
        <main className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen bg-black">

            {/* 顶部标题栏：sticky 粘性定位，高斯模糊背景 (backdrop-blur) */}
            <header className="sticky top-0 z-10 bg-black/70 backdrop-blur-md border-b border-gray-800 p-4">
                <h1 className="text-xl font-bold text-white">探索 (Explore)</h1>
            </header>

            {/* 👇 见证奇迹的时刻！把咱们辛辛苦苦造的墙放进来！ */}
            <PostFeed />

        </main>
    );
}