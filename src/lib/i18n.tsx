"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "zh" | "en";

type Dict = Record<string, { zh: string; en: string }>;

const dict: Dict = {
  "nav.calendar": { zh: "营销日历", en: "Marketing Calendar" },
  "nav.assets": { zh: "素材中心", en: "Asset Hub" },
  "nav.medialibrary": { zh: "媒体库", en: "Media Library" },
  "nav.copywriter": { zh: "AI 文案生成器", en: "AI Copywriter" },
  "nav.multiplatform": { zh: "多平台发帖助手", en: "Multi-Platform Publisher" },
  "nav.reelradar": { zh: "爆点雷达", en: "Reel Radar" },
  "nav.eventsop": { zh: "活动 SOP 生成器", en: "Event SOP Generator" },
  "nav.cms": { zh: "内容管理", en: "Content Manager" },
  "nav.section.tools": { zh: "营销工具", en: "Marketing Tools" },
  "nav.section.system": { zh: "系统设置", en: "System" },
  "sidebar.tagline": { zh: "营销中心", en: "Marketing Hub" },
  "sidebar.footer": { zh: "英雄教育 · 内部工具", en: "EduHero · Internal Tool" },
  "sidebar.role": { zh: "管理员", en: "Admin" },

  "calendar.title": { zh: "营销日历", en: "Marketing Calendar" },
  "calendar.subtitle": {
    zh: "一眼看清这个月每个平台要发什么、谁负责、素材到齐了没有。",
    en: "See what's going out on every platform this month, who owns it, and whether assets are ready.",
  },
  "calendar.addSchedule": { zh: "+ 新增排程", en: "+ New Post" },
  "calendar.backToToday": { zh: "回到今天", en: "Back to Today" },
  "calendar.assetsShortage": { zh: "篇缺素材", en: "posts need assets" },
  "calendar.platformsLegend": { zh: "平台", en: "Platforms" },
  "calendar.statusLegend": { zh: "状态", en: "Status" },

  "assets.title": { zh: "素材中心", en: "Asset Hub" },
  "assets.subtitle": {
    zh: "每篇贴文需要谁提供什么素材，进度一目了然，不用再一个个去问。",
    en: "See exactly who owes what asset for every post — no more chasing people one by one.",
  },
  "assets.pending": { zh: "待提供", en: "Pending" },
  "assets.overdue": { zh: "已逾期", en: "Overdue" },
  "assets.provided": { zh: "已提供", en: "Provided" },
  "assets.all": { zh: "全部", en: "All" },
  "assets.allDepartments": { zh: "所有部门", en: "All Departments" },
  "assets.colAsset": { zh: "素材", en: "Asset" },
  "assets.colPost": { zh: "所属贴文", en: "Post" },
  "assets.colDept": { zh: "负责部门", en: "Department" },
  "assets.colDue": { zh: "期限", en: "Due" },
  "assets.colStatus": { zh: "状态", en: "Status" },
  "assets.markProvided": { zh: "标记已提供", en: "Mark Provided" },
  "assets.noResults": { zh: "没有符合条件的素材", en: "No assets match this filter" },

  "newpost.title": { zh: "新增排程", en: "New Post" },
  "newpost.cancel": { zh: "← 取消", en: "← Cancel" },
  "newpost.titleLabel": { zh: "标题", en: "Title" },
  "newpost.titlePlaceholder": { zh: "例如：中秋节招生活动预告", en: "e.g. Mid-Autumn enrollment promo" },
  "newpost.platformsLabel": { zh: "发布平台", en: "Platforms" },
  "newpost.ownerLabel": { zh: "负责人", en: "Owner" },
  "newpost.notesLabel": { zh: "备注（选填）", en: "Notes (optional)" },
  "newpost.notesPlaceholder": { zh: "需要什么素材、活动细节等", en: "Assets needed, event details, etc." },
  "newpost.submit": { zh: "新增到日历", en: "Add to Calendar" },
  "newpost.assetsLabel": { zh: "需要的素材（勾选模板）", en: "Assets Needed (pick from templates)" },
  "newpost.assetsHint": { zh: "在内容管理的「素材模板」里可以增删这份清单", en: "Manage this checklist in Content Manager → Asset Templates" },
  "newpost.dueOn": { zh: "期限", en: "due" },
  "newpost.customAsset": { zh: "+ 自定义素材", en: "+ Custom asset" },
  "newpost.customAssetName": { zh: "素材名称", en: "Asset name" },
  "newpost.customAssetAdd": { zh: "加入清单", en: "Add to list" },
  "newpost.noAssetsSelected": { zh: "还没选任何素材（可选填）", en: "No assets selected yet (optional)" },
  "newpost.salesRepLabel": { zh: "分配给哪位 Sales（选填）", en: "Assign to Sales Rep (optional)" },
  "newpost.salesRepNone": { zh: "未分配", en: "Unassigned" },

  "detail.salesRep": { zh: "询盘进谁的号码", en: "Leads route to" },
  "detail.salesRepNone": { zh: "未分配", en: "Unassigned" },

  "calendar.workloadTitle": { zh: "本月 Sales 分配", en: "This Month's Sales Assignments" },
  "calendar.workloadUnassigned": { zh: "未分配", en: "Unassigned" },

  "cms.tab.salesReps": { zh: "Sales 号码", en: "Sales Numbers" },
  "cms.salesReps.desc": {
    zh: "每个活动的询盘会进哪位 Sales 的号码，在这里维护名单，新增排程时就能直接选。",
    en: "Maintain the list of sales reps and their numbers here — pick one whenever you create a post.",
  },
  "cms.salesReps.nameLabel": { zh: "姓名", en: "Name" },
  "cms.salesReps.phoneLabel": { zh: "WhatsApp 号码", en: "WhatsApp Number" },

  "detail.performanceTitle": { zh: "成效回环", en: "Performance" },
  "detail.performanceNote": {
    zh: "发布后回来填实际数据，才知道这个开场/角度是不是真的有效。",
    en: "Fill in the real numbers after it goes live — that's how you know if the hook actually worked.",
  },
  "detail.performanceLocked": { zh: "发布后才能记录成效", en: "Available once this post is published" },
  "detail.views": { zh: "播放/触及", en: "Views/Reach" },
  "detail.leads": { zh: "询盘数", en: "Leads" },
  "detail.conversions": { zh: "转换/报名数", en: "Conversions" },

  "calendar.overviewTitle": { zh: "本月总览", en: "This Month at a Glance" },
  "calendar.workloadEmpty": { zh: "本月还没有排程", en: "No posts scheduled this month" },
  "calendar.totalLeads": { zh: "总询盘", en: "Total Leads" },
  "calendar.totalConversions": { zh: "总转换", en: "Total Conversions" },
  "calendar.topPost": { zh: "表现最好", en: "Top Performer" },
  "calendar.noPerformanceData": { zh: "还没有已发布内容的成效数据", en: "No performance data from published posts yet" },

  "detail.close": { zh: "← 关闭", en: "← Close" },
  "detail.owner": { zh: "负责人：", en: "Owner: " },
  "detail.platforms": { zh: "发布平台", en: "Platforms" },
  "detail.status": { zh: "状态", en: "Status" },
  "detail.notes": { zh: "备注", en: "Notes" },
  "detail.assets": { zh: "素材清单", en: "Asset Checklist" },
  "detail.providedCount": { zh: "已提供", en: "provided" },
  "detail.noAssets": { zh: "暂无需要的素材", en: "No assets needed" },

  "cms.title": { zh: "内容管理", en: "Content Manager" },
  "cms.subtitle": {
    zh: "在这里编辑图片、图标、平台、状态和团队名单，不用改代码。",
    en: "Edit images, icons, platforms, statuses and your team list here — no code required.",
  },
  "cms.tab.images": { zh: "图片管理", en: "Images" },
  "cms.tab.icons": { zh: "图标管理", en: "Icons" },
  "cms.tab.platforms": { zh: "平台管理", en: "Platforms" },
  "cms.tab.statuses": { zh: "状态管理", en: "Statuses" },
  "cms.tab.team": { zh: "部门与团队", en: "Departments & Team" },
  "cms.tab.brand": { zh: "品牌颜色", en: "Brand Color" },
  "cms.images.desc": { zh: "管理网站里用到的图片，例如 Logo、活动海报模板。", en: "Manage images used across the site — logo, poster templates, etc." },
  "cms.images.urlLabel": { zh: "图片网址 (URL)", en: "Image URL" },
  "cms.images.nameLabel": { zh: "图片名称", en: "Image Name" },
  "cms.icons.desc": { zh: "每个模块在侧边栏显示的图标，可以换成任何 emoji。", en: "The icon each module shows in the sidebar — swap in any emoji." },
  "cms.platforms.desc": { zh: "编辑每个发布平台的中英文名称和代表色。", en: "Edit each platform's Chinese/English name and brand color." },
  "cms.statuses.desc": { zh: "编辑贴文状态的中英文名称和颜色。", en: "Edit post-status labels (Chinese/English) and colors." },
  "cms.team.deptDesc": { zh: "会向哪些部门索取素材，在这里增减部门。", en: "The departments you request assets from — add or remove here." },
  "cms.team.ownerDesc": { zh: "新增排程时可选的负责人名单。", en: "The list of people selectable as post owners." },
  "cms.labelZh": { zh: "中文名称", en: "Chinese Label" },
  "cms.labelEn": { zh: "英文名称", en: "English Label" },
  "cms.color": { zh: "颜色", en: "Color" },
  "cms.tab.assetTemplates": { zh: "素材模板", en: "Asset Templates" },
  "cms.tab.eventTemplates": { zh: "活动模板", en: "Event Templates" },
  "cms.assetTemplates.desc": {
    zh: "新增排程时可以勾选的标准素材清单，统一名称、负责部门和提前几天要——不同 marketer 用的都是同一套，不会各自乱填。",
    en: "The standard checklist marketers can pick from when creating a post — same names, same owning department, same lead time for everyone.",
  },
  "cms.assetTemplates.nameLabel": { zh: "素材名称", en: "Asset name" },
  "cms.eventTemplates.desc": {
    zh: "活动 SOP 生成器里的活动类型和步骤清单，在这里增删改。",
    en: "The event types and step checklists shown in the Event SOP Generator — manage them here.",
  },
  "cms.eventTemplates.editSteps": { zh: "编辑步骤（{count}）", en: "Edit steps ({count})" },
  "cms.eventTemplates.hideSteps": { zh: "收起步骤", en: "Hide steps" },
  "cms.eventTemplates.addStep": { zh: "+ 新增步骤", en: "+ Add step" },
  "cms.eventTemplates.addTemplate": { zh: "+ 新增活动模板", en: "+ Add Event Template" },

  "action.add": { zh: "新增", en: "Add" },
  "action.delete": { zh: "删除", en: "Delete" },
  "action.save": { zh: "保存", en: "Save" },
  "action.saved": { zh: "已保存", en: "Saved" },
  "action.cancel": { zh: "取消", en: "Cancel" },

  "common.comingSoonNote": {
    zh: "这里是界面预览，还没有连接真实数据 / AI，等界面确认后我们再接上功能。",
    en: "This is a UI preview — no live data or AI is connected yet. We'll wire it up once you confirm the design.",
  },

  "copywriter.title": { zh: "AI 文案生成器", en: "AI Copywriter" },
  "copywriter.subtitle": { zh: "输入这次活动的重点，AI 帮你生成几个可以直接用的文案版本。", en: "Give it the key points and get several ready-to-use caption drafts." },
  "copywriter.inputLabel": { zh: "这次要写什么？", en: "What's this post about?" },
  "copywriter.inputPlaceholder": { zh: "例如：中秋节招生优惠，报名享 20% 折扣，8月底截止", en: "e.g. Mid-Autumn enrollment promo, 20% off, ends end of August" },
  "copywriter.toneLabel": { zh: "语气", en: "Tone" },
  "copywriter.platformLabel": { zh: "目标平台", en: "Target Platforms" },
  "copywriter.generate": { zh: "✨ 生成文案", en: "✨ Generate Captions" },
  "copywriter.resultsTitle": { zh: "生成结果", en: "Generated Drafts" },
  "copywriter.copy": { zh: "复制", en: "Copy" },
  "copywriter.copied": { zh: "已复制", en: "Copied" },
  "copywriter.regenerate": { zh: "↻ 换一批", en: "↻ Regenerate" },
  "copywriter.tone.friendly": { zh: "亲切", en: "Friendly" },
  "copywriter.tone.professional": { zh: "专业", en: "Professional" },
  "copywriter.tone.promo": { zh: "促销", en: "Promotional" },
  "copywriter.tone.playful": { zh: "活泼", en: "Playful" },

  "multiplatform.title": { zh: "多平台发帖助手", en: "Multi-Platform Publisher" },
  "multiplatform.subtitle": { zh: "一篇文案，自动改写成各平台的版本，复制贴上就能用；接上 upload-post.com 后可以一键排程发布。", en: "One caption, auto-adapted for every platform — copy and paste, or schedule it directly once upload-post.com is connected." },
  "multiplatform.inputLabel": { zh: "原始文案", en: "Original Caption" },
  "multiplatform.inputPlaceholder": { zh: "把你的文案贴在这里，或从 AI 文案生成器复制过来", en: "Paste your caption here, or bring one over from the AI Copywriter" },
  "multiplatform.adapt": { zh: "改写成各平台版本", en: "Adapt for All Platforms" },
  "multiplatform.charCount": { zh: "字数", en: "Characters" },
  "multiplatform.copy": { zh: "复制这个版本", en: "Copy this version" },
  "multiplatform.scheduleTitle": { zh: "排程发布", en: "Schedule Publish" },
  "multiplatform.scheduleNote": { zh: "接上 upload-post.com 之后，这里可以直接选时间自动发布到所有勾选的平台。", en: "Once upload-post.com is connected, pick a time here and it publishes automatically to every checked platform." },
  "multiplatform.scheduleButton": { zh: "🚀 排程自动发布（即将开放）", en: "🚀 Schedule Auto-Publish (coming soon)" },

  "reelradar.title": { zh: "爆点雷达", en: "Reel Radar" },
  "reelradar.subtitle": { zh: "每周自动看完同行的 reels，标出爆款和开场套路，抓住下一个爆点。", en: "Automatically scans competitor reels every week and flags the breakout hits and hook patterns." },
  "reelradar.scanButton": { zh: "+ 添加 Reel", en: "+ Add Reel" },
  "reelradar.addReelTitle": { zh: "手动添加 Reel", en: "Add Reel Manually" },
  "reelradar.addReelDesc": {
    zh: "自动抓取还没接入，先手动贴视频信息，AI 会立刻分析打分。",
    en: "Automated scanning isn't connected yet — paste the video's info and AI will score it right away.",
  },
  "reelradar.addReelUrl": { zh: "视频链接", en: "Video URL" },
  "reelradar.addReelAccount": { zh: "账号（不含 @）", en: "Account handle (no @)" },
  "reelradar.addReelText": { zh: "文案 / 转写内容", en: "Caption / Transcript" },
  "reelradar.addReelTextPlaceholder": { zh: "把视频的口播内容或文案贴在这里", en: "Paste the voiceover or caption text" },
  "reelradar.addReelPlays": { zh: "播放数", en: "Plays" },
  "reelradar.addReelLikes": { zh: "点赞数", en: "Likes" },
  "reelradar.addReelComments": { zh: "评论数", en: "Comments" },
  "reelradar.addReelSubmit": { zh: "AI 分析并添加", en: "Analyze & Add" },
  "reelradar.addReelAnalyzing": { zh: "AI 分析中…", en: "Analyzing…" },
  "reelradar.loading": { zh: "加载中…", en: "Loading…" },
  "reelradar.empty": { zh: "还没有任何 Reel，先添加一条试试。", en: "No reels yet — add one to get started." },
  "reelradar.scanNowButton": { zh: "🛰️ 扫描全部竞品", en: "🛰️ Scan All Competitors" },
  "reelradar.scanning": { zh: "扫描中…（可能要 1-2 分钟）", en: "Scanning… (can take 1-2 min)" },
  "reelradar.scanDone": { zh: "扫描完成：新增 {done} 条，失败 {failed} 条", en: "Scan done: {done} added, {failed} failed" },
  "reelradar.statAccounts": { zh: "追踪账号数", en: "Accounts Tracked" },
  "reelradar.statAnalyzed": { zh: "已分析 reels", en: "Reels Analyzed" },
  "reelradar.statViews": { zh: "总播放量", en: "Total Views" },
  "reelradar.statTopHook": { zh: "最常见开场", en: "Top Hook Type" },
  "reelradar.sortNewest": { zh: "最新", en: "Newest" },
  "reelradar.sortTopScore": { zh: "最高分", en: "Top Score" },
  "reelradar.sortMostViews": { zh: "最多播放", en: "Most Views" },
  "reelradar.new": { zh: "新", en: "New" },
  "reelradar.viral": { zh: "爆", en: "Viral" },
  "reelradar.rewrite": { zh: "改写结构（原创）", en: "Rewrite Structure" },
  "reelradar.whyScored": { zh: "为什么给这个分", en: "Why It Scored" },
  "reelradar.hook": { zh: "开场", en: "Hook" },
  "reelradar.structure": { zh: "结构拆解", en: "Structure" },
  "reelradar.cta": { zh: "CTA / 角度", en: "CTA / Angle" },
  "reelradar.rewriteResultTitle": { zh: "改写结果（原创）", en: "Rewritten Draft (Original)" },
  "reelradar.rewriting": { zh: "改写中…", en: "Rewriting…" },
  "reelradar.remix": { zh: "照搬剧本（换我的话）", en: "Remix (My Words)" },
  "reelradar.transcript": { zh: "完整逐字稿", en: "Full Transcript" },
  "reelradar.showTranscript": { zh: "查看逐字稿", en: "View transcript" },
  "reelradar.hideTranscript": { zh: "收起逐字稿", en: "Hide transcript" },
  "reelradar.select": { zh: "选择", en: "Select" },
  "reelradar.selected": { zh: "已选", en: "Selected" },
  "reelradar.deleteSelected": { zh: "删除所选", en: "Delete Selected" },
  "reelradar.cancelSelect": { zh: "取消选择", en: "Cancel" },
  "reelradar.lowScoreHidden": { zh: "低分已隐藏（1-3 分）", en: "Low scores hidden (1-3)" },
  "reelradar.loadMore": { zh: "加载更多", en: "Load more" },
  "reelradar.filterHook": { zh: "开场类型", en: "Hook Type" },
  "reelradar.allHooks": { zh: "全部开场", en: "All Hooks" },
  "reelradar.activityLog": { zh: "扫描记录", en: "Scan Activity" },
  "reelradar.activityDesc": { zh: "每次扫描做了什么、找到几条、哪几条失败、为什么——全部用人话写。", en: "What each scan did, how many it found, what failed and why — all in plain language." },

  "reelradar.tab.radar": { zh: "雷达", en: "Radar" },
  "reelradar.tab.discover": { zh: "发现", en: "Discover" },
  "reelradar.tab.patterns": { zh: "规律", en: "Patterns" },
  "reelradar.tab.scripts": { zh: "剧本", en: "Scripts" },
  "reelradar.tab.account": { zh: "我的", en: "Account" },
  "reelradar.tab.setup": { zh: "设置", en: "Setup" },

  "discover.title": { zh: "发现新的同行", en: "Discover New Creators" },
  "discover.subtitle": { zh: "用关键词去搜 IG（跟真实用户搜一样），把名单以外的创作者的热门 reels 带回来。", en: "Search Instagram by keyword — just like a real user would — to surface creators outside your tracked list." },
  "discover.whyNoHashtag": { zh: "为什么不用 hashtag：2025 年 12 月起 IG 把 hashtag 砍到每篇 5 个，早就不是流量入口了。现在的入口是搜索关键词。", en: "Why not hashtags: since Dec 2025 IG capped hashtags at 5 per post — they stopped being a discovery channel. Search keywords are the entry point now." },
  "discover.startButton": { zh: "+ 手动添加发现的账号", en: "+ Add Discovered Account" },
  "discover.scanButton": { zh: "🛰️ 按关键词扫描", en: "🛰️ Scan by Keyword" },
  "discover.frequencyNote": { zh: "一个月按一次就够", en: "Once a month is enough" },
  "discover.newAccountsTitle": { zh: "值得关注的新账号", en: "Accounts Worth Watching" },
  "discover.newAccountsDesc": { zh: "反复出现、分数又高的陌生账号。", en: "Unfamiliar accounts that keep showing up with high scores." },
  "discover.openIG": { zh: "在 Instagram 打开", en: "Open in Instagram" },
  "discover.addToList": { zh: "+ 加入名单", en: "+ Add to List" },
  "discover.added": { zh: "✓ 已加入", en: "✓ Added" },
  "discover.appearances": { zh: "次出现", en: "appearances" },
  "discover.avgScore": { zh: "平均分", en: "avg score" },
  "discover.foundReels": { zh: "找到的 Reels", en: "Reels Found" },

  "patterns.title": { zh: "什么开场最能打", en: "Which Hooks Actually Work" },
  "patterns.subtitle": { zh: "看完所有同行 reels 后，统计出来的开场套路排行。", en: "Hook-type rankings compiled from every competitor reel scanned." },
  "patterns.darkHorse": { zh: "🐇 本期黑马", en: "🐇 This Week's Dark Horses" },
  "patterns.darkHorseDesc": { zh: "播放量超过自己账号平常 3 倍以上的 reels（IG 用「试演」机制推爆内容，这些就是正在被推的）。", en: "Reels getting 3x+ their account's usual views — IG's \"audition\" mechanism is actively pushing these right now." },
  "patterns.conclusionCard": { zh: "目前「{hook}」开场的播放中位数最高（{views}），共 {count} 条样本", en: "\"{hook}\" hooks currently have the highest median views ({views}) across {count} samples" },
  "patterns.barChartTitle": { zh: "11 种开场类型（按播放中位数排序）", en: "11 Hook Types (ranked by median views)" },
  "patterns.samples": { zh: "样本", en: "samples" },
  "patterns.avgRelevance": { zh: "平均相关度", en: "avg relevance" },
  "patterns.viewAllInRadar": { zh: "→ 在雷达查看这类开场", en: "→ View this hook in Radar" },

  "scripts.title": { zh: "剧本库", en: "Script Library" },
  "scripts.subtitle": { zh: "AI 看完最近的高分内容和开场规律，帮你写出可以直接拍的剧本。", en: "AI reviews recent top scorers and hook patterns to draft scripts you can shoot straight away." },
  "scripts.generate": { zh: "✨ 生成这周的 3 个剧本灵感", en: "✨ Generate 3 Script Ideas This Week" },
  "scripts.generating": { zh: "生成中…", en: "Generating…" },
  "scripts.statusDraft": { zh: "草稿", en: "Draft" },
  "scripts.statusShot": { zh: "已拍", en: "Shot" },
  "scripts.statusArchived": { zh: "档案", en: "Archived" },
  "scripts.edit": { zh: "✦ 编辑", en: "✦ Edit" },
  "scripts.markShot": { zh: "✓ 标记已拍", en: "✓ Mark Shot" },
  "scripts.archive": { zh: "收进档案", en: "Archive" },
  "scripts.delete": { zh: "删除", en: "Delete" },
  "scripts.copyAll": { zh: "复制全文", en: "Copy Full Script" },
  "scripts.copied": { zh: "已复制", en: "Copied" },
  "scripts.coverTitle": { zh: "封面大字", en: "Cover Title" },
  "scripts.hook": { zh: "Hook · 开场（前 3 秒）", en: "Hook (first 3 seconds)" },
  "scripts.beats": { zh: "Beats · 正文", en: "Beats" },
  "scripts.ctaEnding": { zh: "CTA · 收尾", en: "CTA / Ending" },
  "scripts.captionHashtags": { zh: "Caption + Hashtags", en: "Caption + Hashtags" },
  "scripts.duration": { zh: "时长", en: "Duration" },
  "scripts.autosaveNote": { zh: "🛡 不会弄丢你的字：编辑到一半跳开也会自动恢复未保存的修改。", en: "🛡 Your words are safe: unsaved edits are restored automatically even if you navigate away." },
  "scripts.back": { zh: "← 返回剧本库", en: "← Back to Scripts" },
  "scripts.shotLabel": { zh: "镜头建议", en: "Shot suggestion" },

  "account.title": { zh: "我的账号体检", en: "My Account Checkup" },
  "account.subtitle": { zh: "看看你自己的 reels 表现，找出下一个爆点。", en: "See how your own reels are performing and spot the next breakout." },
  "account.rescan": { zh: "+ 添加我的 Reel", en: "+ Add My Reel" },
  "account.scanButton": { zh: "🛰️ 扫描我的账号", en: "🛰️ Scan My Account" },
  "setup.myIgLabel": { zh: "我的 IG 账号（用于扫描自己的 Reel）", en: "My IG handle (used for scanning your own reels)" },
  "account.statCollected": { zh: "已收录 reels", en: "Reels Collected" },
  "account.statMedian": { zh: "播放中位数", en: "Median Views" },
  "account.statMax": { zh: "最高播放", en: "Highest Views" },
  "account.statVoiceover": { zh: "有口播 %", en: "% with Voiceover" },
  "account.myHits": { zh: "我的爆款", en: "My Hits" },
  "account.myHitsDesc": { zh: "超过平常 2 倍表现的 reels，想复制自己的成功？点进去改写结构再来一条。", en: "Reels performing 2x above your average — rewrite the structure to repeat the win." },
  "account.hookComparison": { zh: "开场对比", en: "Hook Comparison" },
  "account.hookComparisonDesc": { zh: "领域最能打的 5 种开场 vs 你用过几次。", en: "The 5 top-performing hooks in your niche vs. how often you've used them." },
  "account.notTriedYet": { zh: "你还没试过", en: "You haven't tried this" },
  "account.diagnosis": { zh: "账号诊断", en: "Account Diagnosis" },
  "account.generateDiagnosis": { zh: "生成我的账号诊断", en: "Generate My Diagnosis" },
  "account.diagnosing": { zh: "分析中…", en: "Analyzing…" },

  "setup.title": { zh: "爆点雷达设置", en: "Reel Radar Setup" },
  "setup.subtitle": { zh: "管理竞品名单、探索关键词、语气档案和扫描设置。", en: "Manage your competitor list, discovery keywords, tone profile, and scan settings." },
  "setup.competitorsTitle": { zh: "A. 竞品名单", en: "A. Competitor List" },
  "setup.competitorsDesc": { zh: "现在 {count} 个账号。加新账号、暂停跟踪、删除。", en: "{count} accounts tracked. Add, pause, or remove." },
  "setup.addCompetitor": { zh: "新增竞品账号", en: "Add competitor handle" },
  "setup.lastScan": { zh: "上次扫描", en: "Last scan" },
  "setup.pause": { zh: "暂停", en: "Pause" },
  "setup.resume": { zh: "恢复", en: "Resume" },
  "setup.keywordsTitle": { zh: "B. 探索关键词", en: "B. Discovery Keywords" },
  "setup.keywordsDesc": { zh: "现在 {count} 个，可加可删。也能在内容管理里编辑。", en: "{count} keywords. Add or remove — also editable from Content Manager." },
  "setup.addKeyword": { zh: "新增关键词", en: "Add keyword" },
  "setup.toneTitle": { zh: "C. 语气档案 ⭐", en: "C. Tone Profile ⭐" },
  "setup.toneDesc": { zh: "从你自己的 reels 学出来的「怎么写才像你」说明书。", en: "Learned from your own reels — a guide to writing in your voice." },
  "setup.toneToggle": { zh: "用我的语气", en: "Use My Tone" },
  "setup.toneOffNote": { zh: "关掉后用中性的大马华语创作者语气。", en: "When off, uses a neutral Malaysian-Chinese creator tone instead." },
  "setup.scanTitle": { zh: "D. 扫描设置", en: "D. Scan Settings" },
  "setup.domainLabel": { zh: "领域描述（AI 用它判断相关度）", en: "Domain description (used to judge relevance)" },
  "setup.sellingPointLabel": { zh: "你卖什么 ⭐（每个剧本都当成这份产品的「试吃」）", en: "What you sell ⭐ (every script treats this as the product's \"free sample\")" },
  "setup.reelsPerAccountLabel": { zh: "每个账号每次抓几条", en: "Reels to fetch per account per scan" },

  "detail.publishGateTitle": { zh: "发布前检查清单", en: "Pre-Publish Checklist" },
  "detail.assetsReady": { zh: "素材已全部到齐", en: "All assets provided" },
  "detail.assetsNotReady": { zh: "还有素材未到齐", en: "Some assets are still missing" },
  "detail.approvedCheckbox": { zh: "内容已审核确认，可以发布", en: "Content reviewed and approved to publish" },
  "detail.publishBlockedNote": {
    zh: "素材没到齐、或还没勾选「已审核」之前，不能标记为已发布。",
    en: "You can't mark this published until assets are ready and the review checkbox is ticked.",
  },

  "medialibrary.title": { zh: "媒体库", en: "Media Library" },
  "medialibrary.subtitle": {
    zh: "存放可以重复使用的照片和影片，新增排程或补交素材时都能直接选用，不用每次重找。",
    en: "Store reusable photos and videos — pick from here when creating posts or fulfilling asset requests, instead of hunting for files every time.",
  },
  "medialibrary.addButton": { zh: "+ 新增媒体", en: "+ Add Media" },
  "medialibrary.nameLabel": { zh: "文件名称", en: "File Name" },
  "medialibrary.urlLabel": { zh: "文件网址 (URL)", en: "File URL" },
  "medialibrary.tagsLabel": { zh: "标签（用逗号分开）", en: "Tags (comma-separated)" },
  "medialibrary.typeLabel": { zh: "类型", en: "Type" },
  "medialibrary.typeImage": { zh: "图片", en: "Image" },
  "medialibrary.typeVideo": { zh: "影片", en: "Video" },
  "medialibrary.allTags": { zh: "所有标签", en: "All Tags" },
  "medialibrary.uploadedBy": { zh: "上传者", en: "Uploaded by" },
  "medialibrary.copyLink": { zh: "复制链接", en: "Copy Link" },
  "medialibrary.copied": { zh: "已复制", en: "Copied" },
  "medialibrary.empty": { zh: "还没有媒体，新增一个开始建立素材库", en: "No media yet — add one to start building your library" },
  "medialibrary.pickTitle": { zh: "从媒体库选择", en: "Pick from Media Library" },
  "medialibrary.attach": { zh: "使用这个", en: "Use this" },
  "medialibrary.cancel": { zh: "取消", en: "Cancel" },

  "assets.pickFromLibrary": { zh: "从媒体库选", en: "Pick from Library" },
  "assets.attachedFile": { zh: "已附加文件", en: "File attached" },

  "notif.title": { zh: "通知", en: "Notifications" },
  "notif.empty": { zh: "目前没有需要处理的事项", en: "Nothing needs your attention right now" },
  "notif.overduePrefix": { zh: "已逾期：", en: "Overdue:" },
  "notif.dueSoonPrefix": { zh: "快到期：", en: "Due soon:" },
  "notif.publishTodayPrefix": { zh: "今天要发布：", en: "Publishing today:" },
  "notif.publishTomorrowPrefix": { zh: "明天要发布：", en: "Publishing tomorrow:" },
  "notif.unapprovedPrefix": { zh: "还没审核确认：", en: "Not yet approved:" },

  "eventsop.title": { zh: "活动 SOP 生成器", en: "Event SOP Generator" },
  "eventsop.subtitle": { zh: "选一个活动类型，自动生成步骤清单和时间表，可以直接放进营销日历。", en: "Pick an event type to generate a step-by-step checklist and timeline you can drop straight into the calendar." },
  "eventsop.selectPrompt": { zh: "选一个活动类型", en: "Choose an event type" },
  "eventsop.generate": { zh: "生成 SOP 清单", en: "Generate SOP" },
  "eventsop.addToCalendar": { zh: "+ 加入营销日历", en: "+ Add to Calendar" },
  "eventsop.daysBefore": { zh: "天前", en: "days before" },

  "cms.images.add": { zh: "新增图片", en: "Add Image" },
  "cms.images.empty": { zh: "还没有图片", en: "No images yet" },
  "cms.icons.change": { zh: "更换 emoji", en: "Change emoji" },
  "cms.team.departments": { zh: "部门", en: "Departments" },
  "cms.team.owners": { zh: "负责人", en: "Owners" },
  "cms.team.addDept": { zh: "新增部门", en: "Add department" },
  "cms.team.addOwner": { zh: "新增负责人", en: "Add owner" },
};

export function translate(key: string, lang: Lang, vars?: Record<string, string>) {
  const entry = dict[key];
  let text = entry ? entry[lang] : key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
}

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("zh");

  useEffect(() => {
    const stored = localStorage.getItem("eduhero-lang") as Lang | null;
    if (stored === "zh" || stored === "en") setLangState(stored);
  }, []);

  const setLang = (next: Lang) => {
    setLangState(next);
    localStorage.setItem("eduhero-lang", next);
  };

  const t = (key: string, vars?: Record<string, string>) => translate(key, lang, vars);

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
