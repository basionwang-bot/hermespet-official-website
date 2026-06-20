import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import "../hermespet.css";

const ICON_URL = "/manus-storage/AppIcon-new-1024_d481cfb2.png";
const BANNER_URL = "/manus-storage/banner_bff01e21.png";

/* ── 版本与下载地址（升级版本时改这里即可） ───────────────────────── */
const REPO = "https://github.com/basionwang-bot/HermesPet";
const MAC_VERSION = "1.4.7";
const WIN_VERSION = "0.1.0";
const DL = {
  macSilicon: `${REPO}/releases/download/v${MAC_VERSION}/HermesPet-${MAC_VERSION}-AppleSilicon.dmg`,
  macIntel: `${REPO}/releases/download/v${MAC_VERSION}/HermesPet-${MAC_VERSION}-Intel.dmg`,
  win: `${REPO}/releases/download/win-v${WIN_VERSION}/HermesPet-${WIN_VERSION}-Setup-x64.exe`,
  latest: `${REPO}/releases/latest`,
  releases: `${REPO}/releases`,
};

/* ── 引擎数据 ─────────────────────────────────────────────────────── */
interface EngineData {
  kicker: string;
  title: string;
  copy: string;
  points: string[];
}

const engines: Record<string, EngineData> = {
  direct: {
    kicker: "零依赖 · 开箱即用",
    title: "在线 AI",
    copy: "选择 DeepSeek、智谱、Kimi、MiniMax 或 OpenAI，填入 API Key 就能开始聊天、翻译、写作和看图。新用户默认进入这一档，几乎零门槛。",
    points: [
      "内置独立推理引擎，连上 Key 即可对话",
      "适合分发给没有 CLI 环境的普通用户",
      "配置与本地 Gateway 完全独立保存",
    ],
  },
  hermes: {
    kicker: "自托管 · 隐私优先",
    title: "Hermes Gateway",
    copy: "连接本地或自部署的 OpenAI 兼容 Gateway，把常规对话任务留在你自己掌控的后端里，数据不出本机。",
    points: [
      "默认地址 http://localhost:8642/v1",
      "健康检查走 /health 自动探活",
      "适合已有自托管服务、追求数据边界的用户",
    ],
  },
  claude: {
    kicker: "本地 Agent · 深度编程",
    title: "Claude Code",
    copy: "通过 claude CLI 执行深度编程任务，支持 Read、Edit、Bash 等工具调用，进度实时同步到屏幕顶部的灵动岛。",
    points: [
      "启动时自动检测真实 PATH，无需手动配环境",
      "文档附件以绝对路径交给 Claude 自己读取",
      "桌宠 Clawd 只在这一模式下跳出来陪你",
    ],
  },
  codex: {
    kicker: "代码 + 生图",
    title: "Codex",
    copy: "通过 codex exec 接入 OpenAI Codex，既能处理代码任务，也能理解图片、生成图像，结果自动落到对话里。",
    points: [
      "每个对话绑定独立 Codex thread，互不串台",
      "输入图片用 -i 参数原样传入",
      "生成的图片会自动捕获并持久化到消息中",
    ],
  },
};

const engineKeys = ["direct", "hermes", "claude", "codex"] as const;

const islandStates: [string, string][] = [
  ["HermesPet", "就绪"],
  ["Claude Code", "工具调用中…"],
  ["Codex", "生成图片中…"],
  ["在线 AI", "思考中…"],
  ["AI 笔记", "已保存到本地"],
];

/* ── 开发历程（与 GitHub Releases 一一对应，可验证） ─────────────────── */
const timelineEvents = [
  { date: "2026.01", title: "项目构思", desc: "开始构思一只住在屏幕顶部、随手可呼出的原生 AI 桌面伴侣。", tone: "accent" },
  { date: "2026.02", title: "v1.0 首发", desc: "首个可用版本：Claude Code 集成 + 灵动岛任务状态。", tone: "accent" },
  { date: "2026.03", title: "v1.2 桌宠系统", desc: "多引擎并行落地，5 只像素桌宠上线，每个模式专属伴侣。", tone: "accent" },
  { date: "2026.05", title: "抖音百万播放", desc: "一条演示视频在抖音突破百万播放，项目正式出圈。", tone: "hot" },
  { date: "2026.05", title: "v1.3 永久记忆", desc: "对话永久保存、知识云图（⌘⇧G）、跨对话记忆全部上线。", tone: "accent" },
  { date: "2026.05", title: "Windows 尝鲜版", desc: "第一个 Windows 版本（v0.1.0）发布，正式迈入双平台。", tone: "win" },
  { date: "2026.06", title: "v1.4 创作中心", desc: "AI 笔记（⌘⇧N）、写作模式、工作流竞技场、账号中心。", tone: "accent" },
  { date: "2026.06", title: "v1.4.7 最新版", desc: "适配 macOS 27，错误信息全程透明，稳定性持续打磨。", tone: "accent" },
];

/* ── 滚动渐显 Hook ────────────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ── 平台识别 ─────────────────────────────────────────────────────── */
function detectPlatform(): "mac" | "win" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = `${navigator.userAgent} ${navigator.platform}`.toLowerCase();
  if (ua.includes("mac")) return "mac";
  if (ua.includes("win")) return "win";
  return "other";
}

export default function Home() {
  const [activeEngine, setActiveEngine] = useState("direct");
  const [islandIndex, setIslandIndex] = useState(0);
  const [platform, setPlatform] = useState<"mac" | "win" | "other">("other");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useReveal();

  useEffect(() => {
    setPlatform(detectPlatform());
    intervalRef.current = setInterval(() => {
      setIslandIndex((prev) => (prev + 1) % islandStates.length);
    }, 2200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const engine = engines[activeEngine] || engines.direct;
  const [islandMode, islandStatus] = islandStates[islandIndex];

  const selectEngine = useCallback((key: string) => setActiveEngine(key), []);

  const primaryHref = platform === "win" ? DL.win : DL.macSilicon;
  const primaryLabel =
    platform === "win" ? "下载 Windows 尝鲜版" : "下载 macOS 版";

  return (
    <div className="hermespet-page">
      <div className="bg-aurora" aria-hidden="true" />
      <div className="bg-grain" aria-hidden="true" />

      {/* ─── Header ─── */}
      <header className="site-header">
        <a className="brand" href="#top">
          <img src={ICON_URL} alt="HermesPet" />
          <span>HermesPet</span>
        </a>
        <nav>
          <a href="#download">下载</a>
          <a href="#experience">体验</a>
          <a href="#features">能力</a>
          <a href="#engines">引擎</a>
          <a href="#timeline">历程</a>
          <a href="#official">官方</a>
        </nav>
        <a className="header-action" href={REPO} target="_blank" rel="noreferrer">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          GitHub
        </a>
      </header>

      <main id="top">
        {/* ─── Hero ─── */}
        <section className="hero">
          <div className="hero-content">
            <div className="hero-copy" data-reveal>
              <div className="hero-badges">
                <span className="hero-badge hero-badge--official">
                  <span className="dot" /> 官方网站
                </span>
                <span className="hero-badge hero-badge--mac">macOS 14+</span>
                <span className="hero-badge hero-badge--win">Windows 尝鲜版已发布</span>
              </div>
              <h1>
                让 AI 住进
                <br />
                屏幕顶部的<span className="grad">刘海</span>里
              </h1>
              <p className="hero-lede">
                点一下就聊，按住就说，拖进文件让它自己读。HermesPet 是一只常驻桌面的原生
                AI 伴侣 —— 多引擎并行、对话永久保存，现已登陆 macOS 与 Windows 双平台。
              </p>
              <div className="hero-cta">
                <a className="btn-primary" href={primaryHref} target="_blank" rel="noreferrer">
                  {primaryLabel}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 5v14M19 12l-7 7-7-7" />
                  </svg>
                </a>
                <a className="btn-secondary" href="#download">
                  查看全部版本
                </a>
              </div>
              <div className="hero-meta">
                <span><strong>v{MAC_VERSION}</strong> · 最新稳定版</span>
                <span className="sep" />
                <span>Apple Silicon &amp; Intel</span>
                <span className="sep" />
                <span>Apache 2.0 开源</span>
              </div>
            </div>

            <div className="hero-visual" data-reveal>
              <div className="hero-glow" aria-hidden="true" />
              <div className="dynamic-island">
                <span className="island-dot" />
                <span className="island-text">{islandMode}</span>
                <span className="island-status">{islandStatus}</span>
              </div>
              <div className="hero-frame">
                <img src={BANNER_URL} alt="HermesPet 产品界面" loading="eager" />
              </div>
              <div className="hero-chip hero-chip--a">⌘⇧G 知识云图</div>
              <div className="hero-chip hero-chip--b">🐾 桌宠陪伴</div>
            </div>
          </div>

          {/* 信任条 */}
          <div className="trust-strip" data-reveal>
            {[
              ["原生构建", "非 Electron · 非 WebView"],
              ["双平台", "macOS · Windows"],
              ["独立开发", "1 人打磨 · 持续更新"],
              ["数据自留", "对话保存在你自己电脑"],
            ].map(([t, s]) => (
              <div className="trust-item" key={t}>
                <div className="trust-title">{t}</div>
                <div className="trust-sub">{s}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Download ─── */}
        <section className="section download-section" id="download">
          <p className="section-label">立即获取</p>
          <h2 className="section-title">选你的平台，一分钟住进桌面</h2>
          <p className="section-desc">
            拿到安装包，填一个 API Key 就能开聊。需要更强能力时再装 Claude Code 或 Codex CLI。
          </p>
          <div className="download-grid" data-reveal>
            {/* macOS */}
            <div className={`dl-card${platform !== "win" ? " dl-card--featured" : ""}`}>
              <div className="dl-head">
                <svg className="dl-os" width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M16.36 12.78c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.75 2.28-1.6 2.78-.41 6.89 1.15 9.14.76 1.1 1.67 2.34 2.86 2.29 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.41-3.64zM14.13 6.02c.64-.78 1.07-1.85.95-2.92-.92.04-2.03.61-2.69 1.38-.59.68-1.11 1.78-.97 2.83 1.02.08 2.07-.52 2.71-1.29z" />
                </svg>
                <div>
                  <h3>macOS</h3>
                  <p>v{MAC_VERSION} · macOS 14 Sonoma 及以上</p>
                </div>
                {platform !== "win" && <span className="dl-tag">推荐</span>}
              </div>
              <ul className="dl-features">
                <li>原生 Swift 6 + SwiftUI，跟随系统刘海/灵动岛</li>
                <li>桌宠陪伴、知识云图、AI 笔记全功能</li>
                <li>App 内自动更新，24 小时内提示新版本</li>
              </ul>
              <div className="dl-actions">
                <a className="btn-primary" href={DL.macSilicon} target="_blank" rel="noreferrer">
                  Apple Silicon (M 系列)
                </a>
                <a className="btn-ghost" href={DL.macIntel} target="_blank" rel="noreferrer">
                  Intel 芯片
                </a>
              </div>
              <p className="dl-hint">不确定芯片？点  菜单 →「关于本机」查看「芯片」一行。</p>
            </div>

            {/* Windows */}
            <div className={`dl-card dl-card--win${platform === "win" ? " dl-card--featured" : ""}`}>
              <div className="dl-head">
                <svg className="dl-os" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M3 5.6l7.2-1v7.1H3V5.6zm0 12.8l7.2 1v-7H3v6zm8.1 1.1L21 21V12.7h-9.9v6.8zm0-15L21 3v8.2h-9.9V4.5z" />
                </svg>
                <div>
                  <h3>Windows</h3>
                  <p>v{WIN_VERSION} 尝鲜版 · 64 位</p>
                </div>
                <span className="dl-tag dl-tag--beta">Beta</span>
              </div>
              <ul className="dl-features">
                <li>顶部小怪兽胶囊，点开即和 AI 对话</li>
                <li>按住右 Ctrl 说话、截图提问、Pin 到桌面</li>
                <li>对话永久保存，桌宠会"吃"掉你拖给它的文件</li>
              </ul>
              <div className="dl-actions">
                <a className="btn-primary btn-primary--win" href={DL.win} target="_blank" rel="noreferrer">
                  下载 Setup (x64)
                </a>
              </div>
              <p className="dl-hint">
                首次打开若弹蓝色提示，点「更多信息」→「仍要运行」即可。尝鲜版仍在打磨，
                <a href={REPO} target="_blank" rel="noreferrer">欢迎反馈</a>。
              </p>
            </div>
          </div>
          <p className="download-foot">
            想看历史版本与更新日志？
            <a href={DL.releases} target="_blank" rel="noreferrer">前往 GitHub Releases →</a>
          </p>
        </section>

        {/* ─── Experience ─── */}
        <section className="section" id="experience">
          <p className="section-label">核心体验</p>
          <h2 className="section-title">把 AI 从"一个窗口"变成桌面顶部的常驻入口</h2>
          <div className="experience-grid">
            {[
              { num: "01", title: "点刘海", desc: "灵动岛胶囊呼出聊天窗口，状态、错误、后台任务都在顶部一眼可见。" },
              { num: "02", title: "按住说话", desc: "全局 Push-to-Talk 录音，松开自动发送，屏幕边缘亮起呼吸光环。" },
              { num: "03", title: "拖进文件", desc: "图片直接传给模型；文档只传本地路径，让 AI 按需自己读取。" },
              { num: "04", title: "并行处理", desc: "每个对话独立锁定后端，翻译、写代码、生图可以同时跑。" },
            ].map((item, i) => (
              <article className="exp-card" key={item.num} data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
                <span className="card-num">{item.num}</span>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ─── Features ─── */}
        <section className="section features-section" id="features">
          <p className="section-label">能力全景</p>
          <h2 className="section-title">不只是聊天，是一整套桌面工作流</h2>
          <p className="section-desc">从随手记到深度编程，HermesPet 把零散的 AI 能力收进一个常驻入口。</p>
          <div className="features-grid">
            {([
              ["知识云图", "⌘⇧G 呼出全屏星云图，聊过的话题自动聚类，点一下就回到那段对话。", "nebula"],
              ["跨对话记忆", "AI 记得你之前聊过的内容，不用每次重新解释，越聊越懂你。", "memory"],
              ["对话永久保存", "聊过的全帮你存着，随时翻、随时搜，加星置顶，旧对话自动归档不删除。", "save"],
              ["AI 笔记", "⌘⇧N 打开三栏本地 Markdown 笔记本，写作模式 + 实时预览，想法随手记。", "note"],
              ["工作流竞技场", "把常做的事做成可复用工作流，会议纪要一键生成，还能多套方案同题比拼。", "flow"],
              ["桌宠陪伴", "像素小怪兽会眨眼、漂浮、跨灵动岛传送，靠近鼠标还会和你互动。", "pet"],
              ["全局语音输入", "在任何 App 里按住快捷键说话，识别后直接送进当前对话。", "voice"],
              ["Spotlight 式快问", "读取选中文本临时问 AI，结果可复制、回填、Pin 或转成完整聊天。", "ask"],
              ["每日早报", "本地记录使用与提问主题，由你指定的 AI 生成一份 Markdown 早报。", "morning"],
            ] as [string, string, string][]).map(([title, desc, key], i) => (
              <article className="feature-card" key={title} data-reveal style={{ transitionDelay: `${(i % 3) * 70}ms` }}>
                <span className="feature-icon">{featureIcon(key)}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ─── Engines ─── */}
        <section className="section engines-section" id="engines">
          <p className="section-label">多引擎</p>
          <h2 className="section-title">不是切换模型，而是给不同任务安排不同工作台</h2>
          <p className="section-desc">每个对话独立绑定后端，发出第一条消息后锁定，互不干扰。</p>
          <div className="engine-tabs" role="tablist" data-reveal>
            {engineKeys.map((key) => (
              <button
                key={key}
                className={`engine-tab${activeEngine === key ? " active" : ""}`}
                type="button"
                role="tab"
                aria-selected={activeEngine === key}
                onClick={() => selectEngine(key)}
              >
                {engines[key].title}
              </button>
            ))}
          </div>
          <div className="engine-panel" data-reveal>
            <div className="engine-panel-main">
              <p className="engine-tag">{engine.kicker}</p>
              <h3>{engine.title}</h3>
              <p className="engine-desc">{engine.copy}</p>
            </div>
            <ul className="engine-points">
              {engine.points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─── Flow ─── */}
        <section className="section flow-section" id="flow">
          <p className="section-label">产品逻辑</p>
          <h2 className="section-title">一条消息从输入到完成的路径</h2>
          <div className="flow-list">
            {[
              { num: "1", title: "入口收集", desc: "聊天框、截图、语音、快问浮窗、桌面拖拽都汇入同一个 ViewModel。" },
              { num: "2", title: "会话绑定", desc: "新对话继承上次使用的模式，发出第一条消息后锁定该后端。" },
              { num: "3", title: "后端路由", desc: "在线 AI 走 HTTP SSE；Claude / Codex 走本地 CLI 子进程并解析 JSON 流。" },
              { num: "4", title: "状态回传", desc: "工具调用、文件改动、后台完成、错误重试都通过通知驱动灵动岛更新。" },
            ].map((item, i) => (
              <div className="flow-step" key={item.num} data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="flow-num">{item.num}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Privacy ─── */}
        <section className="section privacy-section" id="privacy">
          <p className="section-label">技术与隐私</p>
          <h2 className="section-title">原生构建，数据边界讲得清楚</h2>
          <div className="privacy-grid">
            <div className="privacy-card" data-reveal>
              <h3>技术栈</h3>
              <ul>
                <li>macOS 端纯 Swift 6 + SwiftUI，非 Electron、非 WebView。</li>
                <li>ScreenCaptureKit 截屏，全局热键注册到系统级。</li>
                <li>Claude / Codex 通过本地 CLI 子进程接入，自动检测真实 PATH。</li>
                <li>流式输出统一回到 ChatViewModel，按会话和消息 ID 精准落位。</li>
              </ul>
            </div>
            <div className="privacy-card" data-reveal style={{ transitionDelay: "90ms" }}>
              <h3>数据边界</h3>
              <ul>
                <li>对话历史保存在本机 ~/.hermespet/conversations.json。</li>
                <li>图片保存在本机 ~/.hermespet/images/，JSON 里只存路径。</li>
                <li>笔记、Pin 卡片同样落在你自己的电脑上。</li>
                <li>AI 调用走你自己配置的后端，项目本身不代收任何数据。</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ─── Timeline ─── */}
        <section className="section timeline-section" id="timeline">
          <p className="section-label">开发历程</p>
          <h2 className="section-title">从第一行代码到双平台，每一步都有迹可循</h2>
          <p className="section-desc">所有版本与提交记录均可在 GitHub 仓库中逐一验证。</p>
          <div className="timeline-grid">
            {timelineEvents.map((event, i) => (
              <div className={`timeline-card timeline-card--${event.tone}`} key={i} data-reveal style={{ transitionDelay: `${(i % 4) * 60}ms` }}>
                <div className="timeline-date">{event.date}</div>
                <h4>{event.title}</h4>
                <p>{event.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Official ─── */}
        <section className="section official-section" id="official">
          <div className="official-head" data-reveal>
            <div className="official-badge">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 0L10 5.5L16 6L11.5 10L13 16L8 12.5L3 16L4.5 10L0 6L6 5.5L8 0Z" fill="currentColor" />
              </svg>
              官方认证项目
            </div>
            <h2 className="section-title">认准官方渠道，远离盗版风险</h2>
            <p className="section-desc">由原作者 Basion Wang 独立开发并维护，以下是唯一官方渠道。</p>
          </div>

          <div className="official-grid">
            {[
              { label: "原作者", title: "Basion Wang", body: "GitHub @basionwang-bot" },
              { label: "版本验证", title: "codesign 签名", body: "Team ID: R34KL4X4D9", mono: true },
              { label: "许可证", title: "Apache License 2.0", body: "使用需保留版权声明与 NOTICE 文件" },
              { label: "官方仓库", title: "GitHub", body: "github.com/basionwang-bot/HermesPet", href: REPO },
            ].map((c, i) => (
              <div className="official-card" key={c.label} data-reveal style={{ transitionDelay: `${i * 60}ms` }}>
                <div className="card-label">{c.label}</div>
                <h4>{c.title}</h4>
                {c.href ? (
                  <p><a href={c.href} target="_blank" rel="noreferrer">{c.body}</a></p>
                ) : (
                  <p className={c.mono ? "mono accent" : undefined}>{c.body}</p>
                )}
              </div>
            ))}
          </div>

          <div className="stats-row" data-reveal>
            {[
              { value: "v1.4.7", label: "macOS 最新版" },
              { value: "30+", label: "正式发布版本" },
              { value: "100万+", label: "抖音单条播放" },
              { value: "2", label: "支持平台" },
            ].map((stat) => (
              <div className="stat-item" key={stat.label}>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Final CTA ─── */}
        <section className="section cta-section">
          <div className="cta-card" data-reveal>
            <div className="cta-glow" aria-hidden="true" />
            <img className="cta-icon" src={ICON_URL} alt="" />
            <h2>让它今天就住进你的桌面</h2>
            <p>免费、开源、双平台。填一个 API Key 就能开始。</p>
            <div className="install-cta">
              <a className="btn-primary" href={primaryHref} target="_blank" rel="noreferrer">
                {primaryLabel}
              </a>
              <a className="btn-secondary" href={REPO} target="_blank" rel="noreferrer">
                查看源码
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="site-footer">
        <div className="footer-content">
          <div>
            <div className="footer-brand">
              <img src={ICON_URL} alt="" />
              <span>HermesPet</span>
            </div>
            <p className="footer-desc">让 AI 住在你屏幕的顶部。由 Basion Wang 独立开发，macOS 与 Windows 双平台。</p>
          </div>
          <div className="footer-col">
            <h5>下载</h5>
            <a href={DL.macSilicon} target="_blank" rel="noreferrer">macOS (Apple Silicon)</a>
            <a href={DL.macIntel} target="_blank" rel="noreferrer">macOS (Intel)</a>
            <a href={DL.win} target="_blank" rel="noreferrer">Windows 尝鲜版</a>
          </div>
          <div className="footer-col">
            <h5>资源</h5>
            <a href={REPO} target="_blank" rel="noreferrer">GitHub 仓库</a>
            <a href={DL.releases} target="_blank" rel="noreferrer">更新日志</a>
            <a href={`${REPO}/issues`} target="_blank" rel="noreferrer">Issues 反馈</a>
          </div>
          <div className="footer-col">
            <h5>法律与支持</h5>
            <a href={`${REPO}/blob/main/LICENSE`} target="_blank" rel="noreferrer">Apache License 2.0</a>
            <a href="https://afdian.com/a/basionwang" target="_blank" rel="noreferrer">爱发电赞助</a>
            <a href="mailto:basionwang@gmail.com">联系作者</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024–2026 Basion Wang. All rights reserved. Licensed under Apache License 2.0.</p>
          <p>&ldquo;HermesPet&rdquo; 及其 Logo 为 Basion Wang 的商标，未经授权不得用于商业推广。</p>
        </div>
      </footer>
    </div>
  );
}

/* ── 功能图标 ─────────────────────────────────────────────────────── */
function featureIcon(key: string): ReactNode {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (key) {
    case "nebula":
      return <svg {...p}><circle cx="12" cy="12" r="3" /><circle cx="5" cy="6" r="1.4" /><circle cx="19" cy="7" r="1.4" /><circle cx="18" cy="18" r="1.4" /><circle cx="6" cy="17" r="1.4" /><path d="M9.3 10.3 6.3 7M14.7 10.3l3-2.7M14.7 13.7l2.6 3.4M9.3 13.7l-2.6 2.6" /></svg>;
    case "memory":
      return <svg {...p}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-5 0V18A2.5 2.5 0 0 1 4.5 15.5 2.5 2.5 0 0 1 5 10.7 2.5 2.5 0 0 1 7 6.5 2.5 2.5 0 0 1 9.5 2Z" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 5 0V18a2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-.5-4.8A2.5 2.5 0 0 0 17 6.5 2.5 2.5 0 0 0 14.5 2Z" /></svg>;
    case "save":
      return <svg {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>;
    case "note":
      return <svg {...p}><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" /><path d="M9 9h1M9 13h6M9 17h6" /></svg>;
    case "flow":
      return <svg {...p}><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="15" y="15" width="6" height="6" rx="1" /><path d="M9 6h6a2 2 0 0 1 2 2v7" /></svg>;
    case "pet":
      return <svg {...p}><path d="M4 9.5 2.5 5 7 7M20 9.5 21.5 5 17 7" /><path d="M5 13a7 5.5 0 0 1 14 0c0 3.6-3.1 6-7 6s-7-2.4-7-6z" /><path d="M9.5 12.5h.01M14.5 12.5h.01M12 15.5v.01" /></svg>;
    case "voice":
      return <svg {...p}><rect x="9" y="2" width="6" height="11" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 17v4" /></svg>;
    case "ask":
      return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" /><path d="M11 8v.01M11 11v3" /></svg>;
    case "morning":
      return <svg {...p}><circle cx="12" cy="13" r="4" /><path d="M12 3v2M5.6 6.6 7 8M3 13h2M19 13h2M17 8l1.4-1.4M8 19h8" /></svg>;
    default:
      return <svg {...p}><circle cx="12" cy="12" r="9" /></svg>;
  }
}
