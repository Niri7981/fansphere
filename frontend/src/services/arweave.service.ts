// src/services/arweave.service.ts

/**
 * 模拟将文件上传到去中心化存储 Arweave (或 Irys)
 * @param file 用户选择的图片文件
 * @param onProgress 进度回调函数 (0 - 100)
 * @returns 返回一个 64 字节的 Arweave 交易哈希值 (Transaction ID)
 */
export const uploadToArweave = async (
    file: File,
    onProgress?: (progress: number) => void
): Promise<string> => {
    return new Promise((resolve, reject) => {
        // 检查文件大小 (前端防御，限制 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return reject(new Error("文件太大了兄弟，别超过 5MB!"));
        }

        console.log(`[Arweave] 开始上传文件: ${file.name}, 大小: ${(file.size / 1024).toFixed(2)} KB`);

        let progress = 0;

        // 模拟文件分块上传的过程 (每 200ms 涨一点进度)
        const interval = setInterval(() => {
            // 随机增加 10~25 的进度
            progress += Math.floor(Math.random() * 15) + 10;

            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);

                // 触发最终进度
                if (onProgress) onProgress(progress);

                // 模拟生成一个 64 位的真实 Arweave TX ID
                const generateMockHash = () => {
                    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
                    let hash = '';
                    for (let i = 0; i < 64; i++) {
                        hash += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    return hash;
                };

                const mockTxId = generateMockHash();
                console.log(`[Arweave] 上传成功！生成永久哈希: ${mockTxId}`);

                // 延迟一小下再 resolve，感觉更真实
                setTimeout(() => resolve(mockTxId), 300);
            } else {
                // 触发进度回调
                if (onProgress) onProgress(progress);
            }
        }, 200);
    });
};