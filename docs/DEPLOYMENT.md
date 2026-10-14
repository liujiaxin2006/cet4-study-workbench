# 部署与验收

## 在 Floot 上重建
1. 创建自己的 Floot 项目，启用数据库及邮箱密码认证资源。认证资源负责建立 users、user_passwords、sessions、login_attempts 等表和环境密钥。
2. 使用 Floot 编辑器或已授权的 Floot 连接，将本仓库 floot/ 下文件按原路径写入项目。不要复制仓库外层的 floot/ 前缀到平台路径。
3. 按 floot/static/__dev/dependencies.json 补充项目依赖。Floot 预装的依赖无需重复安装。
4. 在自己的数据库执行 database/study-progress.sql；它只创建学习进度表，不导入任何用户数据。已有表时，应先检查结构与 helpers/schema.tsx 一致，不能把 IF NOT EXISTS 当作迁移校验。
5. 确保服务端有 FLOOT_DATABASE_URL 和足够强的 JWT_SECRET。只能放在服务端密钥配置中，不能放进前端或 GitHub。
6. 上传 assets/app-icon.png，用返回的资源路径设置项目 iconUrl；平台会生成 favicon/主屏幕图标。数据库和图标资产都不会因上传源码自动配置。
7. 运行平台类型检查与 helpers/vocabularyPractice.spec.tsx 测试，再发布到自己的地址。

## 脱离 Floot 运行
目前没有独立服务器入口、路由生成器、构建配置或本地一键启动脚本。
迁移需要实现 React Router 页面挂载、全局 Provider、CSS modules、静态资源构建，以及将 endpoints 中 handle(Request) 接到实际 HTTP 服务。
还需要 PostgreSQL、数据库结构、HTTPS 和服务端环境变量；会话 cookie 使用 Secure。
这部分适配尚未提供，不能声称 git clone 后执行 npm run dev 即可启动。

## 上线验收
- 在新站注册测试账号，两台设备使用同一账号登录。
- 设备 A 开始一轮词汇，翻卡选择“没记住”；等保存完成。
- 设备 B 切回页面或等待最多约 30 秒，检查队列、易忘词和结果。
- 同时修改出现版本冲突时，应明确提示并重新读取云端数据，不能静默覆盖。
- 断网时保存应失败、当前词卡保留；联网后重试。
- 检查登录、退出、账号之间记录隔离，以及手机横向溢出与按钮可点击性。

## 提醒
每天 10:00 / 19:00 的提醒由原作者聊天中的自动化提供，不属于此源码中的服务器定时任务，不会随部署自动建立。

