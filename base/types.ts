// ==========================================================================
// base/types.ts —— 数据契约（引擎层最小集）
// 所有"题材相关"字段（intro、color 等）都不在这里——剧本通过 extends 自己加。
// ==========================================================================

/** 世界状态 —— 引擎运行期的唯一状态容器 */
export interface WorldState {
  /** 玩家持有的话题 ID 集合 */
  topics: Set<string>;
  /** 已经触发过的对话 ID 集合（用于 once 语义） */
  visited: Set<string>;
  /** 已经接近过的 NPC ID 集合（剧本可用，引擎不强制使用） */
  metNpcs: Set<string>;
  /** 剧本自由发挥的状态域 */
  custom: Record<string, any>;
}

/** NPC 基础类型 —— 剧本可 extends 加字段（颜色、立绘、阵营等） */
export interface NPCBase {
  id: string;
  name: string;
}

/** 话题基础类型 —— 剧本可 extends 加字段 */
export interface TopicBase {
  id: string;
  label: string;
}

/** 对话基础类型 —— 剧本可 extends 加字段 */
export interface DialogueBase {
  /** 全局唯一 ID */
  id: string;
  /** 接收者（说话的 NPC）的 ID */
  speaker: string;
  /** 用什么话题问命中本对话 */
  topic: string;
  /** 台词文本 */
  text: string;
  /** 命中条件闭包；不写则默认 true */
  trigger?: (w: WorldState) => boolean;
  /** 触发后的副作用闭包；不写则无副作用 */
  effect?: (w: WorldState) => void;
  /** 是否只能触发一次（默认 true） */
  once?: boolean;
}

/** 终局基础类型 */
export interface EndingBase {
  id: string;
  title?: string;
  body: string;
  /** 满足时触发；建议在 ending 列表里按优先级先后排序 */
  condition: (w: WorldState) => boolean;
}

// ──────────────────────────────────────────────────────────────────────────
// UI 文本契约
// 引擎默认 UI 会读取这些 key；剧本必须提供。剧本也可加自己的扩展 key。
// ──────────────────────────────────────────────────────────────────────────

export interface ScriptTexts {
  /** 进入剧本时的开场系统提示 */
  introHint?: string;
  /** 等待玩家选话题时的引导（idle 状态） */
  hintIdle?: string;
  /** 已选话题、等待选 NPC 时的引导（占位 {topic} 会被替换为话题 label） */
  hintSelected?: string;
  /** 剧本结束后的引导 */
  hintEnded?: string;
  /** 取消按钮文本 */
  cancelLabel?: string;
  /** 当玩家用某话题问错对象、对话未命中时的提示（占位 {npc} {topic}） */
  silentReply?: string;
  /** 新话题入库提示（占位 {topics}） */
  newTopicsFlash?: string;
  /** 结局气泡的注脚 */
  endingFooter?: string;
  /** 任意自定义文本（剧本可加） */
  [extra: string]: string | undefined;
}
