'use client'

import { useSubscription } from "@/hooks/useSubscription"
import { collectRoutesUsingEdgeRuntime } from "next/dist/build/utils";
import { Button } from "../ui/button";

export function SubscribeButton({ creatorId, price }: { creatorId: string, price: number }) {
    const { subscribe, isSubscribing } = useSubscription();

    const isAlreadySubscribed = false;
    if (isAlreadySubscribed) {
        return (
            <button disabled className="w-full py-3 px-8 rounded-full bg-gray-800 text-gray-400 font-bold cursor-not-allowed">
                ✅ 您已是尊贵的订阅者
            </button>
        );
    }
    return (
        <button
            onClick={() => subscribe(creatorId, price)}
            disabled={isSubscribing}
            className={`w-full font-bold py-3 px-8 rounded-full transition-all 
                ${isSubscribing
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-[#00AFF0] hover:bg-[#0091C7] text-white active:scale-95'
                }`}>
            {isSubscribing ? '🔗 链上确认中...' : `订阅以查看用户帖子 - ${price} USDC`}
        </button>
    );
}
