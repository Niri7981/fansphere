'use client';

import { useFeed } from "@/hooks/useFeed";
import React from "react";
import { useEffect } from "react";
import { useInView } from 'react-intersection-observer';
import { PostCard } from "./PostCard";

export function PostFeed() {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status
    } = useFeed();

    const { ref, inView } = useInView();

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage)
            fetchNextPage();
    }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);

    if (status === 'pending') {
        return <div className="p-4 text-center text-gray-500">正在疯狂加载推文...</div>;
    }
    if (status === 'error') {
        return <div className="p-4 text-center text-red-500">网络崩溃了，拉取失败！</div>;
    }

    return (
        <div className="flex flex-col">
            {/* 6. [TODO 2 盲敲]：双重循环渲染推文！ 
               外层循环：遍历 data?.pages (每一个 page 就是一个抽屉)
               内层循环：遍历 page.data (把抽屉里的推文挨个变成 PostCard)
               提示：注意看昨天咱们写的 mock.service.ts，每批数据都在 page.data 里面！
            */}
            {data?.pages.map((page, pageIndex) => (
                <React.Fragment key={pageIndex}>
                    {/* 在这里再写一个 map 去遍历 page.data，返回 <PostCard key={post.id} post={post} /> */}
                    {page.data.map((post: any) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </React.Fragment>
            ))}

            {/* 7. [TODO 3 盲敲]：把绊马索 (ref) 绑在底部的 div 上！ */}
            {/* 提示：给下面的 div 加上 ref={ref} */}
            <div ref={ref} className="p-4 text-center text-gray-500">
                {isFetchingNextPage
                    ? '正在拉取更多推文...'
                    : hasNextPage
                        ? '继续向下滑动'
                        : '到底了，没有更多推文了！'}
            </div>
        </div>
    );
}

