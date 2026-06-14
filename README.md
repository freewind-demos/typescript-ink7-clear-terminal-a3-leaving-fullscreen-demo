# typescript-ink7-clear-terminal-a3-leaving-fullscreen-demo

## 简介

精准触发 Ink 7 **路径 A3**：`isLeavingFullscreen` — 上一帧 `lastOutputHeight >= stdout.rows`，本帧 `outputHeight < rows` 时 `clearTerminal`。

## 快速开始

```bash
pnpm install
pnpm start
```

初始 dynamic 行数 **恰好 = rows**（满屏）。**按 `s` 一次**缩到 `rows - 6` 行，观察绿色 STATIC 是否在缩屏瞬间闪。stderr 打印 `[A3] leaving fullscreen`。

按 `q` 退出。

## 如何判断 Static 是否被刷新

1. **Command A 全选**或鼠标拖选绿色 STATIC 行，保持选区
2. 按 `s` 缩屏
3. **选区消失** → Static 被重写（本 demo：缩屏帧 `clearTerminal`）
4. **选区保留** → Static 未重写

**本 demo 预期**：按 `s` 瞬间选区应消失；缩屏后若不再触发 clear，选区可重新拖选并保持。

## 教程

`wasFullscreen = lastOutputHeight >= viewportRows`。从满屏缩到非满屏的那一帧触发 A3，与 A1/A2 互补。

## 注意事项

- 终端 rows 变化会重新计算；缩屏只触发一次（再次按 s 无效）
