// ==========================================================================
// base/engine.ts —— 引擎核心
// 职责（仅此而已）：
//   1. 维护 world 状态（剧本无关）
//   2. 接受核心动作 interact(target, topic)
//   3. 加载/卸载剧本
//   4. 发出事件
// 引擎不知道任何剧本细节、不操作 DOM、不规定题材。
// 即使没有任何剧本，引擎也能"运行"——world 为空，interact() 返回 null。
// ==========================================================================

import { Script } from './script-base';
import { WorldState, DialogueBase, EndingBase } from './types';
import { EngineEventMap, EventName, EventHandler } from './events';

export interface StepResult {
  dialogue?: DialogueBase;
  endingTriggered?: EndingBase;
  newTopics: string[];
}

export class Engine {
  /** 当前世界状态。永远存在，但剧本未加载时为空。 */
  world: WorldState;

  /** 当前加载的剧本。null = 未加载。 */
  script: Script | null = null;

  // —— 内部 —— //
  private listeners = new Map<EventName, Set<Function>>();

  constructor() {
    this.world = this.makeEmptyWorld();
  }

  // ───────────────────────────────────────────────
  // 剧本生命周期
  // ───────────────────────────────────────────────

  /** 加载剧本：清空 world → 调用 script.init → emit 事件 */
  load(script: Script): void {
    if (this.script) this.unload();

    this.script = script;
    this.world = this.makeEmptyWorld();
    script.init?.(this.world);

    this.emit('script.loaded', { script });
  }

  /** 卸载当前剧本：调用 script.unmount → emit 事件 → 清空 world */
  unload(): void {
    if (!this.script) return;
    const script = this.script;
    script.unmount?.();
    this.script = null;
    this.world = this.makeEmptyWorld();
    this.emit('script.unloaded', { script });
  }

  // ───────────────────────────────────────────────
  // 唯一核心动作
  // ───────────────────────────────────────────────

  /**
   * 用某话题与某目标交互（替代旧的 ask）。
   * 返回命中的对话与新增的话题；同时 emit 相应事件。
   * 没加载剧本时返回空结果，不抛错。
   */
  interact(targetId: string, topicId: string): StepResult {
    if (!this.script) {
      this.emit('dialogue.missed', { npcId: targetId, topicId });
      return { newTopics: [] };
    }

    const before = new Set(this.world.topics);
    const dialogue = this.findDialogue(targetId, topicId);

    if (!dialogue) {
      this.emit('dialogue.missed', { npcId: targetId, topicId });
      return { newTopics: [] };
    }

    // 默认每条对话只触发一次
    const once = dialogue.once !== false;
    if (once) this.world.visited.add(dialogue.id);

    // 应用副作用 —— 唯一允许改 world 的入口
    dialogue.effect?.(this.world);

    // 计算本次新增的话题
    const newTopics: string[] = [];
    this.world.topics.forEach(t => { if (!before.has(t)) newTopics.push(t); });

    // 发事件
    this.emit('dialogue.played', { dialogue });
    if (newTopics.length) this.emit('topics.added', { topics: newTopics });

    // 检查终局
    const ending = this.script.endings.find(e => e.condition(this.world));
    if (ending) this.emit('ending.triggered', { ending });

    return { dialogue, endingTriggered: ending, newTopics };
  }

  // ───────────────────────────────────────────────
  // 状态读写（受控）
  // ───────────────────────────────────────────────

  /** 直接设置 custom state 中某字段，并 emit 事件。供"非对话型动作"使用（如指控）。 */
  setCustom(key: string, value: any): void {
    this.world.custom[key] = value;
    this.emit('state.changed', { key, value });

    // 状态变化后可能触发终局
    if (this.script) {
      const ending = this.script.endings.find(e => e.condition(this.world));
      if (ending) this.emit('ending.triggered', { ending });
    }
  }

  // ───────────────────────────────────────────────
  // 事件总线
  // ───────────────────────────────────────────────

  on<E extends EventName>(event: E, handler: EventHandler<E>): void {
    let set = this.listeners.get(event);
    if (!set) { set = new Set(); this.listeners.set(event, set); }
    set.add(handler);
  }

  off<E extends EventName>(event: E, handler: EventHandler<E>): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit<E extends EventName>(event: E, payload: EngineEventMap[E]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.forEach(h => (h as Function)(payload));
  }

  // ───────────────────────────────────────────────
  // 内部辅助
  // ───────────────────────────────────────────────

  private findDialogue(npcId: string, topicId: string): DialogueBase | undefined {
    if (!this.script) return undefined;
    return this.script.dialogues.find(d =>
      d.speaker === npcId &&
      d.topic === topicId &&
      !this.world.visited.has(d.id) &&
      (d.trigger ? d.trigger(this.world) : true)
    );
  }

  private makeEmptyWorld(): WorldState {
    return {
      topics: new Set(),
      visited: new Set(),
      metNpcs: new Set(),
      custom: {},
    };
  }
}
