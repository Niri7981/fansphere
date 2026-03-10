import { AuthManager } from "./auth.service";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchWithAuth(endpoint: string, option: RequestInit = {}) {
    const token = AuthManager.getToken();

    const headers: any = {
        'Content-type': 'application/json',
        ...option.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...option,
        headers,
    });

    if (response.status == 401) {
        AuthManager.clearToken();
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
        throw new Error('登录已过期，请重新登录');
    }

    if (!response.ok) {
        throw new Error(`API 请求失败: ${response.statusText}`);
    }

    return response.json();
}

/**
 * @description FanSphere 核心业务 API 统一调度中心
 * * 负责与中心化后端服务器 (Web2 Server) 进行数据交互。
 * 内部已集成 JWT 鉴权拦截器 (fetchWithAuth)，
 * 自动处理 Token 注入、401 过期拦截及统一错误抛出。
 */
export const ApiService = {
    /**
     * @description 获取公共广场帖子瀑布流 (分页)
     * @param cursor 分页游标
     * @param limit 每页请求数量 (默认 10)
     */

    getFeed: async (cursor?: string, limit: number = 10) => {
        const query = new URLSearchParams({ limit: limit.toString() });
        if (cursor) query.append('cursor', cursor);
        return fetchWithAuth(`/feed?${query.toString()}`);
    },

    /**
     * @description 获取创作者主页详细信息
     * @param address 创作者的钱包公钥地址
     */

    getCreatorProfile: async (address: string) => {
        return fetchWithAuth(`/creators/${address}`);
    },

    /**
     * @description 获取单篇帖子详细数据
     * @param pda 帖子的 PDA 地址
     */

    getPost: async (pda: string) => {
        return fetchWithAuth(`/posts/${pda}`);
    },

    /**
     * @description 校验当前用户是否已订阅某创作者
     * @param creatorAddress 创作者的钱包公钥地址
     */

    getSubscriptionStatus: async (creatorAddress: string) => {
        return fetchWithAuth(`/subscriptions/${creatorAddress}/status`);
    }
};
