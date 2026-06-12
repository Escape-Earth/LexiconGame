// ==========================================================================
// base/presenter.ts —— 视图模型层
//
// 职责：把"引擎事件 + 用户操作 + UI 当前状态"翻译为 UI 可以直接渲染的快照。
// UI 不知道 Engine；只知道 Presenter。
//
// Presenter 的所有外部 API：
//   - 状态变化订阅：onChange(handler)
//   - 一次性消息订阅：onMessage(handler)
//   - 用户操作转发：selectTopic / cancelSelection / clickNpc
//   - 命令式状态修改：setCustom（让"指控"等动作不必绕过引擎）
//   - 当前快照查询：getSnapshot()
// ==========================================================================

import { Engine } from './engine';
import { Script } from './script-base';
import { NPCBase, TopicBase, DialogueBase, EndingBase } from './types';

// —— 视图模型 —— //

export interface ViewSnapshot {
  npcs: ViewNpc[];
  topics: ViewTopic[];
  hint: ViewHint;
  ended: boolean;
  /** 仅供剧本特殊面板使用（如指控按钮）；默认 false */
  customFlags: Record<string, boolean>;
}

export interface ViewNpc {
  npc: NPCBase;
  /** 当前是否可点（受 ended / 是否已选话题影响） */
  enabled: boolean;
  /** 副标题文字（"等待选话题" / "▶ 用此话题质问" / "已结束"） */
  actionLabel: string;
}

export interface ViewTopic {
  topic: TopicBase;
  selected: boolean;
  enabled: boolean;
}

export type ViewHint =
  | { kind: 'idle';     text: string }
  | { kind: 'selected'; text: string; topic: TopicBase }
  | { kind: 'ended';    text: string };

// —— 一次性消息（不在快照里）—— //

export type ViewMessage =
  | { kind: 'system';   text: string }
  | { kind: 'reply';    text: string; npc: NPCBase; topic?: TopicBase; dialogue: DialogueBase }
  | { kind: 'flash';    text: string }
  | { kind: 'ending';   ending: EndingBase };

export type SnapshotHandler = (snapshot: ViewSnapshot) => void;
export type MessageHandler  = (message: ViewMessage) => void;

// ──────────────────────────────────────────────────────────────────────────
// Presenter
// ──────────────────────────────────────────────────────────────────────────

export class Presenter {
  // —— 内部 UI 状态 —— //
  private selectedTopic: string | null = null;
  private ended = false;
  private customFlags: Record<string, boolean> = {};

  // —— 订阅者 —— //
  private snapshotHandlers = new Set<SnapshotHandler>();
  private messageHandlers  = new Set<MessageHandler>();

  // —— 引擎事件 unsubscriber —— //
  private offHandlers: Array<() => void> = [];

  constructor(private engine: Engine, public script: Script) {
    this.bindEngine();
    // 初始引导消息
    if (script.texts.introHint) {
      queueMicrotask(() => this.emitMessage({ kind: 'system', text: script.texts.introHint! }));
    }
  }

  // ───────────────────────────────────────
  // UI 订阅
  // ───────────────────────────────────────

  onChange(handler: SnapshotHandler): () => void {
    this.snapshotHandlers.add(handler);
    handler(this.getSnapshot());
    return () => this.snapshotHandlers.delete(handler);
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  // ───────────────────────────────────────
  // UI 操作
  // ───────────────────────────────────────

  selectTopic(topicId: string): void {
    if (this.ended) return;
    if (!this.engine.world.topics.has(topicId)) return;
    this.selectedTopic = (this.selectedTopic === topicId) ? null : topicId;
    this.emitChange();
  }

  cancelSelection(): void {
    if (this.selectedTopic === null) return;
    this.selectedTopic = null;
    this.emitChange();
  }

  /** 点 NPC：要求当前已选话题；否则忽略 */
  clickNpc(npcId: string): void {
    if (this.ended || !this.selectedTopic) return;
    const topicId = this.selectedTopic;
    this.selectedTopic = null;
    this.engine.interact(npcId, topicId);
    // engine 会经事件回调最终触发 emitChange
    this.emitChange();
  }

  /** 暴露当前 world 给剧本钩子（只读使用） */
  getWorld() {
    return this.engine.world;
  }

  /** 让剧本通过 Presenter 设置 custom 状态（用于"指控"这类非对话型动作） */
  setCustom(key: string, value: any): void {
    this.engine.setCustom(key, value);
    // engine 会发 state.changed 事件
  }

  /** 设置 UI 自定义旗帜（如 showAccusePanel） */
  setFlag(key: string, value: boolean): void {
    if (this.customFlags[key] === value) return;
    this.customFlags[key] = value;
    this.emitChange();
  }

  // ───────────────────────────────────────
  // 快照
  // ───────────────────────────────────────

  getSnapshot(): ViewSnapshot {
    const world = this.engine.world;
    const t = this.script.texts;

    const topics: ViewTopic[] = [];
    for (const topic of this.script.topics) {
      if (!world.topics.has(topic.id)) continue;
      topics.push({
        topic,
        selected: this.selectedTopic === topic.id,
        enabled: !this.ended,
      });
    }

    const npcs: ViewNpc[] = this.script.npcs.map(npc => ({
      npc,
      enabled: !this.ended && this.selectedTopic !== null,
      actionLabel: this.ended
        ? (t.hintEnded ?? '已结束')
        : this.selectedTopic
          ? (t.hintSelected ? '▶ 进行交互' : '▶ 用此话题')
          : (t.hintIdle ?? '等待选择话题'),
    }));

    let hint: ViewHint;
    if (this.ended) {
      hint = { kind: 'ended', text: t.hintEnded ?? '已结束' };
    } else if (this.selectedTopic) {
      const topic = this.script.topics.find(t => t.id === this.selectedTopic)!;
      hint = {
        kind: 'selected',
        text: (t.hintSelected ?? '已选话题 {topic} —— 点 NPC 进行交互').replace('{topic}', topic.label),
        topic,
      };
    } else {
      hint = { kind: 'idle', text: t.hintIdle ?? '在话题本中选一个话题，然后点 NPC' };
    }

    return {
      npcs,
      topics,
      hint,
      ended: this.ended,
      customFlags: { ...this.customFlags },
    };
  }

  // ───────────────────────────────────────
  // 销毁（解绑引擎订阅）
  // ───────────────────────────────────────

  dispose(): void {
    for (const off of this.offHandlers) off();
    this.offHandlers = [];
    this.snapshotHandlers.clear();
    this.messageHandlers.clear();
  }

  // ───────────────────────────────────────
  // 内部
  // ───────────────────────────────────────

  private bindEngine(): void {
    const onDialogue = (p: { dialogue: DialogueBase }) => {
      const npc = this.script.npcs.find(n => n.id === p.dialogue.speaker);
      const topic = this.script.topics.find(t => t.id === p.dialogue.topic);
      if (!npc) return;
      this.emitMessage({ kind: 'reply', text: p.dialogue.text, npc, topic, dialogue: p.dialogue });
      this.emitChange();
    };

    const onMissed = (p: { npcId: string; topicId: string }) => {
      const npc = this.script.npcs.find(n => n.id === p.npcId);
      const topic = this.script.topics.find(t => t.id === p.topicId);
      const tpl = this.script.texts.silentReply ?? '{npc} 似乎对「{topic}」无话可说。';
      const text = tpl.replace('{npc}', npc?.name ?? p.npcId).replace('{topic}', topic?.label ?? p.topicId);
      this.emitMessage({ kind: 'system', text });
      this.emitChange();
    };

    const onTopicsAdded = (p: { topics: string[] }) => {
      const labels = p.topics.map(id => {
        return this.script.topics.find(t => t.id === id)?.label ?? id;
      });
      const tpl = this.script.texts.newTopicsFlash ?? '✨ 新话题：{topics}';
      const text = tpl.replace('{topics}', labels.map(l => `「${l}」`).join('、'));
      this.emitMessage({ kind: 'flash', text });
      // emitChange 已经在 onDialogue 里发了
    };

    const onEnding = (p: { ending: EndingBase }) => {
      this.ended = true;
      this.emitMessage({ kind: 'ending', ending: p.ending });
      this.emitChange();
    };

    this.engine.on('dialogue.played',  onDialogue);
    this.engine.on('dialogue.missed',  onMissed);
    this.engine.on('topics.added',     onTopicsAdded);
    this.engine.on('ending.triggered', onEnding);

    this.offHandlers.push(
      () => this.engine.off('dialogue.played',  onDialogue),
      () => this.engine.off('dialogue.missed',  onMissed),
      () => this.engine.off('topics.added',     onTopicsAdded),
      () => this.engine.off('ending.triggered', onEnding),
    );
  }

  private emitChange(): void {
    const snap = this.getSnapshot();
    this.snapshotHandlers.forEach(h => h(snap));
  }

  private emitMessage(msg: ViewMessage): void {
    this.messageHandlers.forEach(h => h(msg));
  }
}
