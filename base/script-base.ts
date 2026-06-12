// ==========================================================================
// base/script-base.ts —— 剧本契约
//
// 剧本是引擎的"插件应用"：
//   - 提供数据（NPCs / Topics / Dialogues / Endings）
//   - 提供文本（texts，UI 引导文案）
//   - 提供视图钩子（可选；让默认 UI 知道怎么渲染剧本特色）
//   - 提供生命周期（init 必须；mount/unmount 仅当 useDefaultView=false 时需要）
//
// 默认情况下剧本根本不写 UI 类——引擎自带的 DefaultView 会接管。
// 如果剧本想完全自管 UI（如剧本是 Roguelike 网格），把 useDefaultView 改为 false 并实现 mount/unmount。
// ==========================================================================

import { Engine } from './engine';
import { WorldState, NPCBase, TopicBase, DialogueBase, EndingBase, ScriptTexts } from './types';

export interface ScriptMeta {
  /** 剧本的玩家可见标题 */
  title: string;
  /** 副标题 / 一句话简介 */
  subtitle?: string;
  /** 剧本作者 */
  author?: string;
  /** 任意扩展元数据（封面图、版本号等），引擎不读 */
  ext?: Record<string, any>;
}

/** 默认 UI 渲染时给剧本的钩子；剧本可选实现 */
export interface ScriptViewHooks {
  /**
   * 渲染 NPC 卡片的"头像"区。
   * target 是 DefaultView 提供的容器，剧本爱往里塞什么就塞什么（emoji / SVG / img）。
   * 不实现则使用默认渲染（首字 / 名称首字符）。
   */
  renderNpcAvatar?(npc: NPCBase, target: HTMLElement): void;

  /**
   * 渲染 NPC 卡片的"副标题"行（角色 / 阵营 / 头衔）。
   * 不实现则不显示副标题。
   */
  renderNpcSubtitle?(npc: NPCBase, target: HTMLElement): void;

  /**
   * 渲染 NPC 卡片的"主色"。返回 CSS 颜色字符串。
   * 不实现则使用默认色。
   */
  getNpcAccent?(npc: NPCBase): string | undefined;

  /**
   * 渲染对话气泡的内容（允许剧本做关键词高亮等）。
   * 默认行为：plain text。
   */
  renderDialogueText?(text: string, target: HTMLElement): void;

  /** 渲染 Topic 标签的内容（默认显示 label） */
  renderTopicLabel?(topic: TopicBase, target: HTMLElement): void;

  /** 渲染结局气泡的内容（默认是带换行的 plain text） */
  renderEndingBody?(ending: EndingBase, target: HTMLElement): void;

  /** 渲染自定义槽（剧本特色面板：指控、好感度条、日志等） */
  renderCustomSlot?(customSlot: HTMLElement, presenter: import('./presenter').Presenter): void;
}

export abstract class Script implements ScriptViewHooks {
  abstract id: string;
  abstract meta: ScriptMeta;

  // —— 数据 —— //
  abstract npcs: NPCBase[];
  abstract topics: TopicBase[];
  abstract dialogues: DialogueBase[];
  abstract endings: EndingBase[];

  /** UI 文本（默认 UI 会读取这些 key） */
  texts: ScriptTexts = {};

  /**
   * 是否使用引擎自带的默认 UI（推荐 true）。
   * - true（默认）：剧本不需要写 mount/unmount。引擎接管 DOM 渲染。
   * - false：剧本必须实现 mount/unmount 自己渲染（用于完全特殊的玩法）。
   */
  useDefaultView: boolean = true;

  // —— 生命周期钩子（全部可选）—— //

  /**
   * 引擎加载本剧本时调用。
   * 剧本可以往 world 里塞初始话题、初始 custom state 等。
   * 注意：此时 UI 还未挂载。
   */
  init?(world: WorldState): void;

  /**
   * 仅当 useDefaultView=false 时使用。
   * 剧本拿到 container（一个 DOM 容器）+ engine（订阅事件），自由发挥。
   */
  mount?(container: HTMLElement, engine: Engine): void;

  /**
   * 仅当 useDefaultView=false 时使用。
   * 剧本必须：清理 container 内部 DOM、解绑所有事件监听、释放资源。
   */
  unmount?(): void;

  // —— 视图钩子（仅当 useDefaultView=true 时被默认 UI 调用）—— //

  renderNpcAvatar?(npc: NPCBase, target: HTMLElement): void;
  renderNpcSubtitle?(npc: NPCBase, target: HTMLElement): void;
  getNpcAccent?(npc: NPCBase): string | undefined;
  renderDialogueText?(text: string, target: HTMLElement): void;
  renderTopicLabel?(topic: TopicBase, target: HTMLElement): void;
  renderEndingBody?(ending: EndingBase, target: HTMLElement): void;

  /**
   * 默认 UI 提供的"自定义槽"渲染钩子。
   * 剧本可以往 customSlot 里塞自己特有的面板（如指控按钮）。
   * 钩子会在每次 snapshot 变化后被调用 —— 剧本应该是幂等的（自己判断要不要显示）。
   */
  renderCustomSlot?(customSlot: HTMLElement, presenter: import('./presenter').Presenter): void;

  // —— 剧本可挂载的额外样式（用于 DefaultView 主题）—— //

  /**
   * 可选：剧本主题 CSS 字符串。
   * DefaultView 会在 mount 时把它注入 <head>，unmount 时移除。
   */
  themeCss?: string;
}
