// ==========================================================================
// base/helpers.ts —— 闭包工厂（剧本作者的工具箱）
// 每个函数返回一个闭包；剧本作者把闭包写进 data.ts 的 trigger / effect 字段
// ==========================================================================

import { WorldState } from './types';

// ---------- Predicate（条件）工厂 ----------

/** 玩家是否拥有某话题 */
export const has = (topic: string) =>
  (w: WorldState): boolean => w.topics.has(topic);

/** 是否已经问过某条对话 */
export const asked = (dialogueId: string) =>
  (w: WorldState): boolean => w.visited.has(dialogueId);

/** 是否已经接近过某 NPC */
export const met = (npcId: string) =>
  (w: WorldState): boolean => w.metNpcs.has(npcId);

/** 自定义状态等于某值 */
export const stateEq = (key: string, val: any) =>
  (w: WorldState): boolean => w.custom[key] === val;

/** 与 */
export const and = (...preds: ((w: WorldState) => boolean)[]) =>
  (w: WorldState): boolean => preds.every(p => p(w));

/** 或 */
export const or = (...preds: ((w: WorldState) => boolean)[]) =>
  (w: WorldState): boolean => preds.some(p => p(w));

/** 非 */
export const not = (p: (w: WorldState) => boolean) =>
  (w: WorldState): boolean => !p(w);

/** 总是 true（默认 trigger） */
export const always = () => (_w: WorldState): boolean => true;

// ---------- Effect（副作用）工厂 ----------

/** 添加一个话题 */
export const addTopic = (topic: string) =>
  (w: WorldState): void => { w.topics.add(topic); };

/** 移除一个话题（剧本想要的话） */
export const removeTopic = (topic: string) =>
  (w: WorldState): void => { w.topics.delete(topic); };

/** 设置自定义状态 */
export const setState = (key: string, val: any) =>
  (w: WorldState): void => { w.custom[key] = val; };

/** 组合多个副作用 */
export const all = (...effects: ((w: WorldState) => void)[]) =>
  (w: WorldState): void => effects.forEach(e => e(w));

/** 什么都不做（默认 effect） */
export const nothing = () => (_w: WorldState): void => { /* noop */ };
