<div align="center">

# HermesPet 官方网站

**[hermespet-official-website]** · HermesPet（Hermes 桌宠）官方宣传站点的源码仓库

让 AI 住进屏幕顶部的刘海里 —— 点一下就聊，按住就说，拖进文件让它自己读。

[官方仓库](https://github.com/basionwang-bot/HermesPet) · [下载最新版](https://github.com/basionwang-bot/HermesPet/releases/latest) · [更新日志](https://github.com/basionwang-bot/HermesPet/releases)

</div>

---

## 这是什么

本仓库是 **HermesPet 桌面 AI 伴侣的官方宣传单页站点**，用 React + Vite 构建，纯静态部署。
产品本体（macOS / Windows 客户端）在另一个仓库：[basionwang-bot/HermesPet](https://github.com/basionwang-bot/HermesPet)。

### 产品当前状态

| 平台 | 版本 | 说明 |
| --- | --- | --- |
| **macOS** | `v1.4.7`（稳定版） | 原生 Swift 6 + SwiftUI，支持 macOS 14+，Apple Silicon / Intel 双架构，App 内自动更新 |
| **Windows** | `v0.1.0`（尝鲜版 / Beta） | 64 位安装包，在线 AI 聊天、桌宠、语音、截图提问、对话永久保存 |

> 升级版本时，下载链接只需改 `client/src/pages/Home.tsx` 顶部的 `MAC_VERSION` / `WIN_VERSION` 两个常量。

## 技术栈

- **React 19 + TypeScript + Vite** —— 客户端路由用 wouter
- 宣传页为单文件组件 `client/src/pages/Home.tsx` + 独立样式 `client/src/hermespet.css`
- 暗色主题、红霓虹品牌色，极光渐变背景 + 滚动渐显（IntersectionObserver，尊重 `prefers-reduced-motion`）
- 设计 token 集中在 `client/src/index.css`，shadcn/ui 组件库备用

## 本地开发

```bash
pnpm install      # 安装依赖（需要 pnpm 10+）
pnpm dev          # 启动本地开发服务器
pnpm build        # 生产构建，产物在 dist/public
pnpm test         # 运行 vitest 单元测试
```

## 目录结构

```
client/
  index.html                  ← HTML 入口 + SEO / OG 元信息
  src/
    pages/Home.tsx            ← 宣传页全部内容（含下载地址常量）
    hermespet.css             ← 宣传页样式与动画
    index.css                 ← 全局设计 token
    components/ui/            ← shadcn/ui 组件
```

## 修改内容指南

- **改文案 / 功能卡 / 时间线**：编辑 `Home.tsx` 顶部的数据数组（`engines` / `timelineEvents` / 各 section 的内联数组）
- **升级下载版本**：改 `Home.tsx` 的 `MAC_VERSION` / `WIN_VERSION`
- **改视觉 / 配色**：编辑 `hermespet.css` 顶部的 `:root` CSS 变量
- **改 SEO / 分享卡**：编辑 `client/index.html`

## 官方与版权

本站点及 HermesPet 由原作者 **Basion Wang**（GitHub [@basionwang-bot](https://github.com/basionwang-bot)）独立开发并维护。
请认准官方仓库与官方 Releases 渠道下载，谨防盗版。

- 许可证：**Apache License 2.0**（使用需保留版权声明与 NOTICE 文件）
- 「HermesPet」及其 Logo 为 Basion Wang 的商标，未经授权不得用于商业推广。

© 2024–2026 Basion Wang. All rights reserved.
