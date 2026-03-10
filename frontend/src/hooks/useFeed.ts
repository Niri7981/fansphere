import { ApiService } from "@/services/api.service";
import { useInfiniteQuery } from "@tanstack/react-query";

/**
 * @description 全局公域瀑布流数据引擎 (Infinite Feed Hook)
 * * @overview
 * 核心驱动器：封装了 React Query 的 useInfiniteQuery。
 * 采用游标分页 (Cursor Pagination) 策略，底层完美复现 X (Twitter) / Instagram 的无缝滚动加载体验。
 * 在此层自动处理了竞态条件拦截、后台数据静默刷新、多页数据数组拼接以及本地缓存穿透。
 * * @returns {Object} 返回自动化状态机，包含 data (推文数据流), fetchNextPage (下一页触发器), isLoading 等
 */

export function useFeed() {
    return useInfiniteQuery({
        queryKey: ['post', 'feed'],

        queryFn: async ({ pageParam = undefined }) => {
            const response = await ApiService.getFeed(pageParam, 10);
            return response;
        },

        getNextPageParam: (lastPage: any) => {
            if (lastPage && lastPage.nextCursor) {
                return lastPage.nextCursor;
            }
            return undefined;
        },
        initialPageParam: undefined,
    });
}