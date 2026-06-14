#!/usr/bin/env node
import { Box, Static, Text, render, useApp, useInput, useStdout } from "ink";
import { type FC, useEffect, useMemo, useState } from "react";

// 对齐 A2：outputHeight 不含 Static；static-only 时不渲染 dynamic 区 → previousOutputHeight=0
// → 首次超屏 hadPreviousFrame=false，不 clear；step2 缩半屏 → A3 clear
const STATIC_MARKER =
  "▓▓▓ STATIC ▓▓▓ 请 Cmd+A 全选本行 | 5s 后自动超屏 | 再 3s 缩半屏 | 观察选区";

const WAIT_MS = 5000;
const OVERFLOW_HOLD_MS = 3000;
// dynamic 区：margin + 标题 + 一行说明
const DYNAMIC_OVERHEAD = 3;
const OVERFLOW_EXTRA = 3;

type Phase = "static-only" | "overflow" | "half";

const App: FC = () => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const rows = stdout?.rows ?? 24;

  const [phase, setPhase] = useState<Phase>("static-only");
  const [lineCount, setLineCount] = useState(0);

  const overflowCount = rows + OVERFLOW_EXTRA;
  const halfCount = Math.max(1, Math.floor(rows / 2) - DYNAMIC_OVERHEAD);

  useEffect(() => {
    process.stderr.write(
      "[demo] 启动：仅 Static 一行。请 Cmd+A 全选绿色 STATIC，5s 后自动超屏\n",
    );

    const overflowTimer = setTimeout(() => {
      process.stderr.write(`[step1] overflow enter: 0 → ${overflowCount} (>${rows}) | est. interactive ${DYNAMIC_OVERHEAD + overflowCount}\n`);
      setPhase("overflow");
      setLineCount(overflowCount);
    }, WAIT_MS);

    const halfTimer = setTimeout(() => {
      const prevInteractive = DYNAMIC_OVERHEAD + overflowCount;
      const nextInteractive = DYNAMIC_OVERHEAD + halfCount;
      process.stderr.write(
        `[step2] half: ${overflowCount} → ${halfCount} | est. interactive ${prevInteractive} (>=${rows}) → ${nextInteractive} (<${rows})\n`,
      );
      if (prevInteractive >= rows && nextInteractive < rows) {
        process.stderr.write("[A3] leaving fullscreen → 预期 clearTerminal，选区应消失\n");
      }
      setPhase("half");
      setLineCount(halfCount);
    }, WAIT_MS + OVERFLOW_HOLD_MS);

    return () => {
      clearTimeout(overflowTimer);
      clearTimeout(halfTimer);
    };
  }, [rows, overflowCount, halfCount]);

  const dynamicLines = useMemo(() => {
    return Array.from({ length: lineCount }, (_, index) => {
      return `dynamic ${String(index + 1).padStart(3, "0")} / ${lineCount} | rows=${rows}`;
    });
  }, [lineCount, rows]);

  useInput((input) => {
    if (input === "q") {
      exit();
    }
  });

  const estInteractive = lineCount > 0 ? lineCount + DYNAMIC_OVERHEAD : 0;

  return (
    <Box flexDirection="column">
      <Static items={[STATIC_MARKER]}>
        {(item) => (
          <Text bold color="green">
            {item}
          </Text>
        )}
      </Static>

      {lineCount > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold>Ink A3 · {phase}</Text>
          <Text dimColor>
            已 {lineCount} 行 dynamic（interactive ≈{estInteractive} 行
            {estInteractive > rows ? " 超屏" : estInteractive >= rows ? " 满屏" : " 未超屏"}）| q 退出
          </Text>
          {dynamicLines.map((line) => (
            <Text key={line}>{line}</Text>
          ))}
        </Box>
      )}
    </Box>
  );
};

render(<App />);
