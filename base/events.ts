// ==========================================================================
// base/events.ts —— 事件类型
// 所有引擎发出的事件在此声明。剧本和 UI 通过 engine.on(name, handler) 订阅。
// 命名空间：'<domain>.<verb>' 形式。
// ==========================================================================

import { DialogueBase, EndingBase } from './types';
import { Script } from './script-base';

export interface EngineEventMap {
  // 剧本生命周期
  'script.loaded':    { script: Script };
  'script.unloaded':  { script: Script };

  // 对话流
  'dialogue.played':  { dialogue: DialogueBase };
  'dialogue.missed':  { npcId: string; topicId: string };

  // 状态变化
  'topics.added':     { topics: string[] };
  'topics.removed':   { topics: string[] };
  'state.changed':    { key: string; value: any };

  // 终局
  'ending.triggered': { ending: EndingBase };
}

export type EventName = keyof EngineEventMap;
export type EventHandler<E extends EventName> = (payload: EngineEventMap[E]) => void;
