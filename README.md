# Lexicon Game

> 一个**剧本驱动的对话玩法引擎**：玩家点话题、点 NPC、推进剧情、解锁多结局。
> 引擎核心约 500 行，剧本写一份 `data.ts` 即可注册新故事——基座代码无需改动。

## 🚀 快速开始

```bash
# 1. 克隆
git clone https://github.com/chaosluna/LexiconGame.git
cd LexiconGame

# 2. 构建（无依赖、无 install，esbuild 会从 npx 缓存拉一次）
npx esbuild main.ts --bundle --format=esm --outfile=dist/bundle.js --target=es2020 --sourcemap
# 或者直接双击 build.bat（Windows）

# 3. 起一个 HTTP 服务（避开 CORS）
npx serve . -l 8765

# 4. 浏览器打开
# http://localhost:8765/
```

## 🎮 玩法

打开后是**剧本选择菜单**，目前内置两个：

| 剧本 | 题材 | 时长 | 难度 |
|---|---|---|---|
| ☕ Hello, Lexicon! | 咖啡店打工 | 3 分钟 | 教学示例 |
| 🗡️ 艾尔德兰之夜 | 推理 + 多结局 | 10-15 分钟 | 完整玩法 |

进入剧本后，核心循环：**选话题 → 选 NPC → 看回应 → 解锁新话题 → 直到触发结局**。

## 🏗️ 架构

```
base/                       ← 引擎（题材无关、剧本无关）
├── types.ts                数据契约
├── helpers.ts              触发条件 / 副作用闭包工厂
├── script-base.ts          Script 抽象类 + 视图钩子
├── engine.ts               核心：interact + 事件总线
├── events.ts               事件类型
├── presenter.ts            视图模型层（UI 与引擎的桥梁）
└── default-view.ts         默认 UI 实现（剧本可不写 UI）

scripts/                    ← 所有剧本
├── registry.ts             剧本工厂列表
├── hello/                  示例剧本
│   ├── data.ts             ★ 文案/AI 主要工作的地方
│   ├── logic.ts            视图钩子 + 剧本特有动作
│   ├── theme.ts            主题颜色覆盖
│   └── index.ts            barrel
└── eldran/                 完整推理剧本（同样结构）

main.ts                     宿主入口（剧本菜单 + 调度）
docs/
├── writer-prompt.md        给 AI 写剧本用的 system prompt
└── writer-guide-ai.md      规范文档
```

### 加新剧本

复制 `scripts/hello/` 重命名，改 `data.ts` 的 6 个常量，在 `scripts/registry.ts` 加一行 `() => new MyScript()`。**基座一行不动**。

## 📐 设计原则

1. **数据闭包驱动** —— `data.ts` 里 `trigger: has('xxx')` 是函数引用，不是字符串解析
2. **引擎与剧本严格分层** —— 引擎不知道任何剧本字段；剧本不直接 import engine
3. **UI 三层解耦** —— `Engine ↔ Presenter ↔ DefaultView`；剧本只通过视图钩子定制渲染
4. **为扩展而生** —— 加新剧本、新主题、新交互全靠扩展点，不改基座

更详细的玩法定义、数据模型、协议见 `docs/`。

## 📜 许可证

MIT
