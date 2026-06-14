# typescript-ink7-clear-terminal-a3-leaving-fullscreen-demo

## 简介

演示 Ink 7 **路径 A3**：`isLeavingFullscreen` — 仅当**上一帧** `lastOutputHeight >= stdout.rows`、**本帧** `outputHeight < rows` 时才 `clearTerminal`。

对照：**上一帧** `< rows` 时，本帧即使变矮也**不会** clear。

## 快速开始

```bash
pnpm install
pnpm start
```

## 演示流程

1. **启动**：**只有绿色 STATIC 一行**（dynamic 区未挂载 → interactive outputHeight = 0）
2. **立刻** Cmd+A 或拖选 STATIC，保持选区
3. **5s 后 step1**：挂载 dynamic 区 `rows + 3` 行 → **超屏，选区应仍在**（`hadPreviousFrame === false`，同 A2）
4. **再 3s step2**：缩至约半屏 → **选区应消失**（上一帧 interactive `>= rows` → A3）

stderr 打印 `[step1]` / `[step2]` / `[A3]`。

按 `q` 退出。

## 如何判断 Static 是否被刷新

- **step2 后选区消失** → 符合 A3 `clearTerminal` 重写 Static

## 与 A2 的关键一致点

Ink 的 `outputHeight` **不含 Static**。A2 等待期不渲染 dynamic 区 → `lastOutputHeight = 0` → 首次超屏 `hadPreviousFrame === false` → 不 clear。

A3 若等待期仍渲染标题/说明（interactive 区已有输出），则 `hadPreviousFrame === true`，首次超屏会误触发 clear。本 demo 已对齐 A2：`lineCount === 0` 时不挂载 dynamic Box。

## 教程

`wasFullscreen = lastOutputHeight >= viewportRows`（仅 interactive 区）。step1 对齐 A2 首次超屏；step2 离开满屏走 A3。

## 注意事项

- 必须在 TTY 跑
- stderr 的 `interactive` 为估算（不含 Static）
