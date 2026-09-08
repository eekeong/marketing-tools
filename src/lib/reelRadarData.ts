export const HOOK_TYPES = [
  "直接提问",
  "反直觉断言",
  "点名痛点",
  "卖关子",
  "先亮结果",
  "承诺教学",
  "蹭热点",
  "故事开场",
  "避坑警告",
  "对比",
  "其他",
] as const;

export type HookType = (typeof HOOK_TYPES)[number];
