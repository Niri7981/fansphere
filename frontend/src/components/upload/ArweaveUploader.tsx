'use client'
import { useRef, useState } from 'react';
import { useArweaveUpload } from '@/hooks/useArweaveUpload';

export default function ArweaveUploader() {
    // 灵魂注入！只拿需要的遥控器按钮
    const { isUploading, progress, uploadedHash, upload } = useArweaveUpload();

    // UI 特效状态：拖拽悬停高亮
    const [isDragActive, setIsDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // --- 拦截浏览器拖拽事件 ---
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) upload(file); // 直接扔给 Hook 处理！
    };

    // --- 画皮 ---
    return (
        <div
            className={`relative w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-400'
                }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                className="hidden"
                ref={inputRef}
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload(file);
                }}
            />

            {/* 根据 Hook 传来的状态，傻瓜式渲染 */}
            {isUploading ? (
                <div className="flex flex-col items-center justify-center">
                    <span className="text-sm text-blue-400 font-bold">{progress}%</span>
                    <span className="text-xs text-gray-400 mt-1">上传中</span>
                </div>
            ) : uploadedHash ? (
                <div className="flex flex-col items-center justify-center text-green-400">
                    <span className="text-2xl">✓</span>
                    <span className="text-xs mt-1">已就绪</span>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-gray-500">
                    <span className="text-2xl">+</span>
                    <span className="text-xs mt-1">上传头像</span>
                </div>
            )}
        </div>
    );
}