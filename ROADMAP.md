FanSphere 全栈架构终版蓝图
0. 现状基线确认
当前已跑通的内容：
createvault 指令（create.rs:140）：49 字节数据，PDA seeds = ["post", maker, seed]
PostState：114 字节，7个字段
前端：buildCreateVaultInstruction 正确构建 49 字节 Buffer，PDA 推导已对齐
测试页（page.tsx）：直接 Keypair 签名方式验证通过
以下所有扩展均向后兼容，不破坏现有合约存储结构。
