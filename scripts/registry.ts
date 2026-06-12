// ==========================================================================
// scripts/registry.ts —— 剧本汇总
//
// 唯一职责：列出所有可玩剧本的工厂函数。
// 不重复 title / subtitle —— 那些信息从 script.meta 读。
// ==========================================================================

import { Script } from '../base/script-base';
import { HelloScript } from './hello';
import { EldranScript } from './eldran';
import { SacrificeScript } from './detective-sacrifice';
import { ConanScript } from './conan-magic';

export type ScriptFactory = () => Script;

export const SCRIPT_FACTORIES: ScriptFactory[] = [
  () => new HelloScript(),
  () => new EldranScript(),
  () => new SacrificeScript(),
  () => new ConanScript(),
];
