#!/usr/bin/env node
import { Box, Static, Text, render, useApp, useInput, useStdout } from "ink";
import { type FC, useMemo, useState } from "react";

// Ink 路径 A3：isLeavingFullscreen — 上一帧 outputHeight >= rows，本帧 < rows
const STATIC_MARKER = "▓▓▓ STATIC ▓▓▓ 按 s 缩屏瞬间若闪 = clearTerminal(A3 leaving fullscreen)";

const App: FC = () => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const rows = stdout?.rows ?? 24;

  // false = 满屏 rows 行；true = 缩到 rows - 6
  const [shrink, setShrink] = useState(false);
  const shrunkCount = Math.max(5, rows - 6);
  const lineCount = shrink ? shrunkCount : rows;

  const dynamicLines = useMemo(() => {
    return Array.from({ length: lineCount }, (_, index) => {
      return `dynamic ${String(index + 1).padStart(3, "0")} / ${lineCount} | rows=${rows}`;
    });
  }, [lineCount, rows]);

  useInput((input) => {
    if (input === "q") {
      exit();
      return;
    }

    if (input === "s" && !shrink) {
      process.stderr.write(`[A3] leaving fullscreen: ${rows} (>=${rows}) → ${shrunkCount} (<${rows})\n`);
      setShrink(true);
    }
  });

  return (
    <Box flexDirection="column">
      <Static items={[STATIC_MARKER]}>
        {(item) => (
          <Text bold color="green">
            {item}
          </Text>
        )}
      </Static>

      <Box flexDirection="column" marginTop={1}>
        <Text bold>Ink A3 · isLeavingFullscreen</Text>
        <Text dimColor>
          当前 {lineCount} 行 {shrink ? "(已缩)" : "(=rows 满屏)"} | 按 s 缩屏 | q 退出
        </Text>
        {dynamicLines.map((line) => (
          <Text key={line}>{line}</Text>
        ))}
      </Box>
    </Box>
  );
};

render(<App />);
