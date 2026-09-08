import { Post } from "./types";

export const mockPosts: Post[] = [
  {
    id: "p1",
    title: "开学季招生优惠 - 早鸟报名",
    date: "2026-08-03",
    platforms: ["facebook", "instagram"],
    status: "published",
    owner: "Amy",
    notes: "已发布，反应不错，点击率高于平均。",
    assets: [
      { id: "a1", name: "招生海报 (1080x1080)", requestedFrom: "设计部", status: "provided", dueDate: "2026-08-01" },
    ],
  },
  {
    id: "p2",
    title: "老师专访 Reel - 数学科主任",
    date: "2026-08-06",
    platforms: ["tiktok", "instagram"],
    status: "published",
    owner: "Kevin",
    assets: [
      { id: "a2", name: "老师访谈影片素材", requestedFrom: "教学部", status: "provided", dueDate: "2026-08-04" },
    ],
  },
  {
    id: "p3",
    title: "本周免费讲座宣传",
    date: "2026-08-11",
    platforms: ["facebook", "whatsapp"],
    status: "assets_needed",
    owner: "Amy",
    notes: "还差讲座封面图，已跟设计部要了两次。",
    assets: [
      { id: "a3", name: "讲座封面图", requestedFrom: "设计部", status: "pending", dueDate: "2026-08-10" },
      { id: "a4", name: "讲师简介文字", requestedFrom: "教学部", status: "provided", dueDate: "2026-08-08" },
    ],
  },
  {
    id: "p4",
    title: "学生成绩喜报 - SPM 优异生",
    date: "2026-08-13",
    platforms: ["facebook", "instagram", "xiaohongshu"],
    status: "draft",
    owner: "Siew Ling",
    assets: [
      { id: "a5", name: "优异生合照", requestedFrom: "教务处", status: "overdue", dueDate: "2026-08-09" },
    ],
  },
  {
    id: "p5",
    title: "开放日活动预告",
    date: "2026-08-15",
    platforms: ["facebook", "instagram", "tiktok", "website"],
    status: "ready",
    owner: "Kevin",
    assets: [
      { id: "a6", name: "开放日场地照片", requestedFrom: "行政部", status: "provided", dueDate: "2026-08-10" },
    ],
  },
  {
    id: "p6",
    title: "教育贴士系列 #1 - 如何准备 UPSR",
    date: "2026-08-18",
    platforms: ["facebook", "xiaohongshu"],
    status: "idea",
    owner: "Amy",
    assets: [],
  },
  {
    id: "p7",
    title: "开放日活动 Reel 花絮",
    date: "2026-08-22",
    platforms: ["tiktok", "instagram"],
    status: "scheduled",
    owner: "Kevin",
    assets: [
      { id: "a7", name: "活动当天影片", requestedFrom: "行政部", status: "pending", dueDate: "2026-08-16" },
    ],
  },
  {
    id: "p8",
    title: "月底促销 - 报名享折扣",
    date: "2026-08-27",
    platforms: ["facebook", "instagram", "whatsapp"],
    status: "idea",
    owner: "Siew Ling",
    assets: [],
  },
];
