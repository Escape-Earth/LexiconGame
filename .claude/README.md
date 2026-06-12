# `.claude/` —— Claude Code 配置

本目录是给 Claude Code（或兼容的 AI 编辑助手）使用的能力扩展。仅在使用 Claude Code 进入本仓库时生效。

## 目录结构

```
.claude/
├── commands/
│   └── new-script.md       ← /new-script 斜杠命令
└── skills/
    └── new-script/
        └── SKILL.md         ← 创建新剧本的完整流程
```

## 可用命令

### `/new-script`

引导式创建一个新的 Lexicon 剧本：交互式收集需求 → 设计大纲 → 写 4 个剧本文件 → 注册到 registry → 打包 → 起本地服务让你试玩。

**用法**：在 Claude Code 里直接输入 `/new-script`，然后跟着引导回答问题。

不需要参数。也可以在对话里直接说"帮我做个新剧本"——Claude 会自动调用 `new-script` skill。

## 想加新命令？

1. 在 `commands/` 下加 `<name>.md`（轻量入口，描述命令用途 + 调用对应 skill）
2. 在 `skills/<name>/SKILL.md` 下写完整能力（前置 frontmatter 必须有 `name` 和 `description`）

约定：命令永远只是"触发器"，真正的能力都在 skill 里——这样能力体积可以独立成长，且别的 skill 也能调用它。
