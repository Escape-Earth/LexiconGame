// ==========================================================================
// main.ts —— 引擎宿主入口
//
// 职责：
//   1. 创建 Engine
//   2. 渲染剧本选择菜单（从 SCRIPT_FACTORIES 读取，title 来自 script.meta）
//   3. 玩家选剧本：
//      - 用 factory() 创建 Script
//      - engine.load(script)（触发 init）
//      - 创建 Presenter（Script + Engine 桥梁）
//      - 创建 DefaultView 或调用 script.mount（视 useDefaultView 而定）
//   4. 玩家点"返回菜单" → 拆掉 view → engine.unload()
//
// main.ts 不知道任何剧本字段，也不直接渲染对话/话题/NPC。
// ==========================================================================

import { Engine } from './base/engine';
import { Script } from './base/script-base';
import { Presenter } from './base/presenter';
import { DefaultView } from './base/default-view';
import { SCRIPT_FACTORIES, ScriptFactory } from './scripts/registry';

// ───── 全局状态 ─────
const engine = new Engine();
let presenter: Presenter | null = null;
let view: DefaultView | null = null;

// ───── DOM ─────
const $menu  = document.getElementById('script-menu')!;
const $stage = document.getElementById('script-stage')!;
const $back  = document.getElementById('back-btn')!;
const $bar   = document.getElementById('current-script')!;

// ───── 启动菜单 ─────
function showMenu(): void {
  // 清掉舞台
  if (view) { view.unmount(); view = null; }
  if (presenter) { presenter.dispose(); presenter = null; }
  if (engine.script) {
    // 如果剧本自管 UI，让它 unmount
    if (!engine.script.useDefaultView) engine.script.unmount?.();
    engine.unload();
  }
  $stage.style.display = 'none';
  $stage.innerHTML = '';
  $menu.style.display = '';
  $back.style.visibility = 'hidden';
  $bar.textContent = '尚未加载剧本';

  $menu.innerHTML = '';
  if (SCRIPT_FACTORIES.length === 0) {
    $menu.innerHTML = `<div class="empty-menu">还没有任何剧本被注册。<br>在 <code>scripts/registry.ts</code> 中加入一条即可。</div>`;
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'menu-grid';
  for (const factory of SCRIPT_FACTORIES) {
    // 实例化一次只为读 meta（轻量），玩的时候再调一次工厂
    const probe = factory();
    const card = document.createElement('button');
    card.className = 'script-card';
    card.innerHTML = `
      <div class="card-id">${probe.id}</div>
      <h2>${probe.meta.title}</h2>
      <p>${probe.meta.subtitle ?? ''}</p>
      <div class="card-cta">▶ 进入剧本</div>`;
    card.onclick = () => playScript(factory);
    grid.appendChild(card);
  }
  $menu.appendChild(grid);
}

// ───── 切换到剧本舞台 ─────
function playScript(factory: ScriptFactory): void {
  const script: Script = factory();

  $menu.style.display = 'none';
  $stage.style.display = '';
  $stage.innerHTML = '';
  $back.style.visibility = '';
  $bar.textContent = script.meta.title;

  // 引擎加载剧本（触发 init）
  engine.load(script);

  // 桥接：Presenter
  presenter = new Presenter(engine, script);

  if (script.useDefaultView) {
    // 引擎默认 UI
    view = new DefaultView($stage, presenter, script);
    view.mount();
  } else {
    // 剧本自管 UI（保留出口，用于未来某些特殊剧本）
    script.mount?.($stage, engine);
  }
}

// ───── 返回菜单 ─────
$back.onclick = () => showMenu();

// ───── 启动 ─────
showMenu();

// 调试用
(window as any).__engine = engine;
(window as any).__presenter = () => presenter;
