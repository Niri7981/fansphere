// src/app/(public)/explore/loading.tsx

export default function Loading() {
    return (
        // 占据全屏、黑色背景、内容居中
        <div className="flex justify-center items-center h-screen bg-black">
            {/* animate-pulse 是 Tailwind 自带的呼吸灯闪烁动画！ */}
            <div className="text-blue-500 text-xl font-bold animate-pulse">
                数据连接中...
            </div>
        </div>
    );
}