import { useState } from 'react';
import { ApiService } from '@/services/api.service';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
export function useUnlockPost() {
    const [isUnlocking, setIsUnlocking] = useState(false);
    const queryClient = useQueryClient();
    const startUnlockingPolling = async (pdaAddress: string, signature: string) => {
        setIsUnlocking(true);

        try {
            console.log(`拿着小票 ${signature} 去找后端要数据...`);

            const subscription = await ApiService.getSubscriptionStatus(pdaAddress);

            await new Promise(resolve => setTimeout(resolve, 2000));

            alert('🔓 解锁成功!React Query 缓存已更新，正在为你展示私密内容！');

            queryClient.invalidateQueries({ queryKey: ['post', 'feed'] });

        } catch (error: any) {
            console.error('解锁失败:', error.message);
        } finally {
            setIsUnlocking(false);
        }
    };
    return { startUnlockingPolling, isUnlocking };
}
