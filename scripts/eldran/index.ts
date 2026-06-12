// ==========================================================================
// scripts/eldran/index.ts —— 剧本对外入口（barrel）
// 外部代码（如 registry）只 import 这个文件，不知道剧本内部如何组织。
// ==========================================================================

export { EldranScript } from './logic';
export type { EldranNPC } from './data';
