---
name: new-script
description: 在 Lexicon Game 仓库中创建一个全新的剧本（scripts/<name>/data.ts + logic.ts + theme.ts + index.ts），自动注册到 registry，并启动 dev server 让用户验证。当用户说 "新建剧本"、"做个剧本"、"加个剧本"、调用 /new-script 命令、或描述要做一个新的对话故事时调用本 skill。
---

# Lexicon · 新剧本创建器

## 你的角色

你是 Lexicon 引擎的剧本助产士。用户描述故事，你产出一套完整可跑的剧本文件，把它注册进引擎，并启服务让用户立刻试玩。

你**不需要**理解整个引擎源码——本 skill 已经把契约写清楚。你只要按下面的流程走。

---

## 必读：文件布局与契约

每个剧本是 `scripts/<id>/` 下的 4 个文件：

```
scripts/<id>/
├── data.ts        ← 6 个常量：TEXTS / NPCS / TOPICS / DIALOGUES / ENDINGS / INITIAL_TOPICS
├── logic.ts       ← Script 子类，挂上 data，实现视图钩子（颜色/头像/副标题等）
├── theme.ts       ← 导出 THEME_CSS 字符串，覆盖 .lex-layout 下的 CSS 变量
└── index.ts       ← barrel：重导出 Script 类
```

外加要修改一个文件：

```
scripts/registry.ts ← 在 SCRIPT_FACTORIES 数组里加一行 () => new YourScript()
```

**你不需要碰 base/ 下任何文件**。如果你想改基座，停下来跟用户确认——这通常是你跑偏了。

---

## 数据契约（剧本作者必须遵守）

### NPCBase / TopicBase / DialogueBase / EndingBase / WorldState

```ts
import { NPCBase, TopicBase, DialogueBase, EndingBase, ScriptTexts, WorldState } from '../../base/types';

interface NPCBase    { id: string; name: string; }
interface TopicBase  { id: string; label: string; }
interface DialogueBase {
  id: string;
  speaker: string;            // NPC id
  topic: string;              // Topic id
  text: string;
  trigger?: (w: WorldState) => boolean;   // 默认 true
  effect?:  (w: WorldState) => void;       // 默认无副作用
  once?: boolean;             // 默认 true（每条对话只触发一次）
}
interface EndingBase {
  id: string;
  title?: string;
  body: string;
  condition: (w: WorldState) => boolean;
}

interface WorldState {
  topics: Set<string>;        // 玩家持有的话题
  visited: Set<string>;       // 已经触发过的对话 id
  metNpcs: Set<string>;       // 已经接近过的 NPC（一般不用）
  custom: Record<string, any>;// 剧本自由发挥的状态域
}
```

剧本可以通过 `extends NPCBase` 加自定义字段（颜色、头像 emoji、副标题等），但读取这些字段的责任在 logic.ts 的视图钩子里。

### Helpers（写 trigger/effect 用的闭包工厂）

```ts
import {
  has, asked, met, stateEq,         // 谓词
  and, or, not, always,              // 组合
  addTopic, removeTopic, setState,   // 副作用
  all, nothing,                      // 副作用组合
} from '../../base/helpers';

// 用法示例：
trigger: has('betrayer'),
trigger: and(has('a'), not(has('b'))),
trigger: stateEq('chapter', 2),
effect:  addTopic('new_topic'),
effect:  all(addTopic('a'), addTopic('b'), setState('flag', true)),
```

### ScriptTexts（UI 文案模板）

```ts
const TEXTS: ScriptTexts = {
  introHint:      'string',                    // 进入剧本时的开场系统消息
  hintIdle:       'string',                    // 未选话题时的引导
  hintSelected:   'string',                    // 已选话题时的引导（占位 {topic}）
  hintEnded:      'string',                    // 结束后的提示
  cancelLabel:    'string',                    // 取消按钮文案
  silentReply:    'string',                    // 对话未命中（占位 {npc} {topic}）
  newTopicsFlash: 'string',                    // 新话题入库（占位 {topics}）
  endingFooter:   'string',                    // 结局气泡注脚
};
```

---

## 文本高亮规则（重要）

剧本作者在 `text` 中写 `【XXX】` 时，**XXX 必须严格等于某个 Topic 的 label**（不是 id），并且本条 Dialogue 的 `effect` 必须包含对应的 `addTopic('<id>')`。

举例：
```ts
{
  id: 'selene.healer',
  speaker: 'selene', topic: 'healer',
  text: '「她对您唱的圣咏不是治愈，是【献祭】。」',  // 高亮"献祭"
  effect: addTopic('sacrifice'),                    // 必须真实入库
}
```

否则玩家看见高亮但话题没入库，是糟糕的体验。

---

## 视图钩子（logic.ts 里）

如果剧本扩展了 NPC 字段，在 logic.ts 里实现以下钩子，让默认 UI 知道怎么渲染：

```ts
class YourScript extends Script {
  // 必须项
  id = 'your-id';
  meta = { title: '...', subtitle: '...', author: '...' };
  npcs = NPCS; topics = TOPICS; dialogues = DIALOGUES; endings = ENDINGS;
  texts = TEXTS;
  themeCss = THEME_CSS;

  init(world: WorldState) {
    for (const t of INITIAL_TOPICS) world.topics.add(t);
  }

  // 视图钩子（按需实现）
  getNpcAccent(npc: NPCBase): string | undefined { return (npc as YourNPC).color; }
  renderNpcAvatar(npc: NPCBase, target: HTMLElement) { target.textContent = (npc as YourNPC).emoji; }
  renderNpcSubtitle(npc: NPCBase, target: HTMLElement) { target.textContent = (npc as YourNPC).role; }
  renderDialogueText?(text: string, target: HTMLElement) { /* 自定义文本渲染，如关键词高亮 */ }
  renderEndingBody?(ending: EndingBase, target: HTMLElement) { /* 自定义结局渲染 */ }
  renderCustomSlot?(customSlot: HTMLElement, presenter: Presenter) { /* 剧本特色面板，如指控按钮 */ }
}
```

`renderDialogueText` 一般用来做 `【XXX】` 高亮——参考 `scripts/eldran/logic.ts`。

---

## 主题（theme.ts）

```ts
export const THEME_CSS = `
.lex-layout {
  --lex-bg: #色值;            /* 主背景 */
  --lex-bg-2: #色值;          /* 面板背景 */
  --lex-bg-3: #色值;          /* 面板头背景 */
  --lex-line: #色值;          /* 边框/分隔 */
  --lex-fg: #色值;            /* 主文字 */
  --lex-fg-dim: #色值;        /* 弱化文字 */
  --lex-accent: #色值;        /* 强调色（话题、标签） */
  --lex-accent-bg: rgba(...); /* 强调色背景态 */
  --lex-good: #色值;          /* 结局色 */
  --lex-warn: #色值;          /* 警告色（指控/已结束） */
  --lex-warn-bg: rgba(...);

  font-family: "字体栈", sans-serif;
}

/* 剧本特有的 .xxx-* 选择器（例如关键词高亮 .eld-kw、指控按钮等）放这里 */
`;
```

参考 `scripts/eldran/theme.ts`（暗色控制台风）和 `scripts/hello/theme.ts`（暖色咖啡风）。

---

## 不变式（违反就报错）

1. 所有 `Dialogue.speaker` 必须存在于 NPCS
2. 所有 `Dialogue.topic` 必须存在于 TOPICS
3. 所有 `addTopic / removeTopic / has` 引用的 id 必须存在于 TOPICS
4. `INITIAL_TOPICS` 中每项必须存在于 TOPICS
5. 所有 id（NPC/Topic/Dialogue/Ending）全局唯一
6. 至少 1 条 Ending 在合法路径下可达
7. ID 字符集只允许：`[a-z0-9_.-]`，小写

---

## 工作流程（你按这个走）

### Step 0：理解请求
读用户的指令。如果只是说"新建剧本"，跳到 Step 1 收集需求。如果用户已经描述了故事，直接进 Step 2。

### Step 1：交互式收集需求

通过 `AskUserQuestion` 收集（多轮、每轮聚焦一件事）：

1. **基础信息**
   - 剧本名（中文标题，如《艾尔德兰之夜》）
   - 剧本 id（英文 slug，如 `eldran-night`）—— 你可以建议，让用户确认
   - 一句话简介（subtitle）

2. **题材与基调**
   - 题材（推理 / 恋爱 / 恐怖 / 喜剧 / 哲学等）
   - 视觉基调（暗色 / 暖色 / 冷调 / 复古 / 极简等——决定 theme.ts 的色彩方向）

3. **NPC 阵容**
   - 数量（一般 2-4 个；3 个最经典）
   - 每个 NPC：名字、角色定位（如骑士、神官）、代表色、头像/图标（emoji 即可）

4. **核心冲突 / 玩家目标**
   - 玩家在故事里要做什么？追真相？追逃跑？追恋爱？做选择？
   - 是否有"指控环节"或类似的"做最终选择"环节？

5. **话题骨架**
   - 大致几层话题？（建议 3 层：初始入口、中段交叉、终局触发）
   - 列出大约 10-15 个关键概念（话题）

6. **结局**
   - 几个结局（一般 2-5 个）
   - 每个结局的触发条件（如指控某人、收集到某话题集合、自定义状态等）

不要一次问完——分 2-3 轮，每轮 2-3 个问题。

### Step 2：起草数据骨架

**先写一个简短的设计大纲发给用户确认**（不是直接写文件）：
- NPC 列表（带颜色 emoji）
- Topics 列表（按层）
- 自我介绍 + 第 0 层 + 第 1 层 + 终局触发 大致路径
- 每个结局的触发条件
- 主题色草案

用户确认或要求调整。**禁止跳过这一步直接写文件。**

### Step 3：决定初始话题策略

参考 `scripts/eldran/data.ts` 的"醒来"模式：玩家开局通常只有**一个或几个**初始话题，用它去问任意 NPC 触发自我介绍。**避免设计成 "与XX搭话" 这种把对话路径明示给玩家的话题**——那会破坏探索感。

好的初始话题命名：`wake_up` / `start` / `look_around` / 直接以场景元素命名（如 `desk`、`door`）。

### Step 4：生成 4 个文件

按以下顺序写：

1. **data.ts** —— 含 6 个常量。注释清晰，每段对话 effect 必须与 text 里的【方括号】对齐。
2. **theme.ts** —— 导出 `THEME_CSS`，覆盖 `.lex-layout` 下的 CSS 变量。
3. **logic.ts** —— Script 子类，挂载数据 + 实现视图钩子。
4. **index.ts** —— barrel：`export { YourScript } from './logic'; export type { YourNPC } from './data';`

每个文件写完后立刻检查与不变式是否一致（特别是 ID 唯一性、引用合法性）。

### Step 5：注册到 registry

修改 `scripts/registry.ts`：

```ts
// 顶部加 import
import { YourScript } from './your-id';

// SCRIPT_FACTORIES 数组里加一行
() => new YourScript(),
```

### Step 6：构建 + 验证

```bash
# 类型检查（可选但推荐）
npx --yes -p typescript@5 tsc --noEmit

# 打包
npx --yes esbuild main.ts --bundle --format=esm --outfile=dist/bundle.js --target=es2020 --sourcemap

# 起服务（如果 8765 已被占用，换 8766/8767）
npx --yes serve . -l 8765
```

构建报错就回头改 data.ts。常见错误：单引号字符串里漏转义、导入了不存在的 helper、`speaker`/`topic` 引用了不存在的 id。

### Step 7：交付与提示

把 URL 和玩法路径告诉用户：

> ✅ 剧本已创建并注册。
>
> **试玩**：http://localhost:8765/ → 选择"<剧本标题>"
>
> **推荐路径**：
> 1. 用「<初始话题>」问 X → 解锁 ...
> 2. ...
> 3. 触发结局 ...
>
> 你也可以试错，看看错误结局有什么内容。

如果用户后续要调整剧本，提醒他们：**只动 `scripts/<id>/data.ts`**（基本所有内容性改动都只在那个文件）。

---

## 自检清单（提交前必跑）

- [ ] 所有 NPC 有不同的 id 和颜色
- [ ] 每条 Dialogue 的 speaker / topic 都存在
- [ ] 每条 Dialogue 中 `【XXX】` 里的字都对应一个 Topic.label，且 effect 中有相应 addTopic
- [ ] INITIAL_TOPICS 不为空，且每项都在 TOPICS 中
- [ ] 至少 1 条 Ending 的 condition 能在合法对话链下满足
- [ ] 玩家任意状态下都至少有一条可触发的 Dialogue（除非已抵达 ending）
- [ ] 主题 CSS 覆盖了所有 `--lex-*` 变量（缺一个会回退到默认）
- [ ] registry.ts 里加了一行
- [ ] tsc --noEmit 通过
- [ ] esbuild 打包成功
- [ ] 浏览器打开能看到剧本卡片，能跑通至少一个 ending

---

## 常见错误模式

| 错误 | 现象 | 修法 |
|---|---|---|
| 中文里夹了未转义的英文单引号 | 编译报 TS1005 | 用全角引号或换双引号字符串 |
| `speaker: 'foo'` 但 NPCS 里没 `foo` | 沉默响应 | 拼写检查 |
| `effect: addTopic('foo')` 但 TOPICS 里没 `foo` | 玩家拿到一个不存在的话题 | 拼写检查 |
| 重复 id | 后一个覆盖前一个 | 改名 |
| 玩家卡死（剧情没下家） | 某个状态下无可触发 Dialogue | 给"惰性回应"或新话题 |
| 主题颜色没生效 | CSS 选择器写成 `.lex-stage` | 改成 `.lex-layout`（v0.4 起的新根） |

---

## 参考实现

- `scripts/eldran/` —— 完整推理剧本（13 话题、36 对话、3 结局、指控面板、暗色主题）
- `scripts/hello/` —— 极简教学剧本（4 话题、5 对话、1 结局、emoji 头像、暖色主题）

不要复制粘贴它们——但**强烈建议读一遍**，特别是 eldran 的 logic.ts（视图钩子 + renderCustomSlot 指控面板）。

---

## 关键限制

- **不要碰 base/**。如果你觉得需要改基座（加 helper、改 Script 抽象类），停下来跟用户讨论。
- **不要碰 main.ts、index.html、style.css**。这些是引擎宿主。
- **不要替用户决定题材或角色**。永远先问。
- **不要省略设计大纲那一步**——直接写文件 → 用户不喜欢 → 全部重写，浪费。
