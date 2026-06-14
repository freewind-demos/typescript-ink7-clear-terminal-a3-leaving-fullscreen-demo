#!/usr/bin/env node
import { Box, Static, Text, render, useApp, useInput, useStdout } from "ink";
import { type FC, useEffect, useMemo, useRef, useState } from "react";

// 对齐 A2：outputHeight 不含 Static；static-only 时不渲染 dynamic 区 → previousOutputHeight=0
// → 首次满屏 hadPreviousFrame=false，不 clear
// step2：从最后一行起每秒删 10 字；行数不变 → 不 clear；整行删完才减高 → 离开满屏 → A3 clear
const STATIC_MARKER =
  "▓▓▓ STATIC ▓▓▓ 请 Cmd+A 全选本行 | 5s 后满屏 | 再 3s 起末行每秒少 10 字 | 观察选区";

const WAIT_MS = 5000;
const FULLSCREEN_HOLD_MS = 3000;
const CHAR_TRIM_MS = 1000;
const CHAR_TRIM_STEP = 10;
// dynamic 区：margin + 标题 + 一行说明
const DYNAMIC_OVERHEAD = 3;

type Phase = "static-only" | "overflow" | "shrinking";

const createDynamicLine = (index: number, total: number, rows: number) => {
  const head = `dynamic ${String(index + 1).padStart(3, "0")} / ${total} | rows=${rows}`;
  const pad = "·".repeat(Math.max(0, 80 - head.length));
  return `${head} ${pad}`;
};

const App: FC = () => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const rows = stdout?.rows ?? 24;

  const [phase, setPhase] = useState<Phase>("static-only");
  const [dynamicLines, setDynamicLines] = useState<string[]>([]);
  const [trimLineIndex, setTrimLineIndex] = useState(-1);
  const [trimmedChars, setTrimmedChars] = useState(0);

  const trimRef = useRef({ lineIndex: -1, trimmed: 0 });

  const dynamicLineCount = Math.max(1, rows - DYNAMIC_OVERHEAD);

  useEffect(() => {
    const fullscreenTimer = setTimeout(() => {
      const est = DYNAMIC_OVERHEAD + dynamicLineCount;
      process.stderr.write(`[step1] ${dynamicLineCount} lines | est ${est}\n`);
      setDynamicLines(
        Array.from({ length: dynamicLineCount }, (_, index) => {
          return createDynamicLine(index, dynamicLineCount, rows);
        }),
      );
      setPhase("overflow");
    }, WAIT_MS);

    const shrinkTimer = setTimeout(() => {
      process.stderr.write(`[step2] -${CHAR_TRIM_STEP}/s\n`);
      const lastIndex = dynamicLineCount - 1;
      trimRef.current = { lineIndex: lastIndex, trimmed: 0 };
      setTrimLineIndex(lastIndex);
      setTrimmedChars(0);
      setPhase("shrinking");
    }, WAIT_MS + FULLSCREEN_HOLD_MS);

    return () => {
      clearTimeout(fullscreenTimer);
      clearTimeout(shrinkTimer);
    };
  }, [rows, dynamicLineCount]);

  useEffect(() => {
    if (phase !== "shrinking" || trimLineIndex < 0) {
      return;
    }

    const interval = setInterval(() => {
      const { lineIndex, trimmed } = trimRef.current;

      setDynamicLines((lines) => {
        if (lineIndex < 0 || lineIndex >= lines.length) {
          return lines;
        }

        const line = lines[lineIndex];
        const nextTrimmed = trimmed + CHAR_TRIM_STEP;

        if (nextTrimmed < line.length) {
          trimRef.current = { lineIndex, trimmed: nextTrimmed };
          setTrimmedChars(nextTrimmed);
          return lines;
        }

        const nextLines = lines.filter((_, index) => index !== lineIndex);
        const nextIndex = nextLines.length - 1;
        const prevEst = DYNAMIC_OVERHEAD + lines.length;
        const nextEst = nextLines.length > 0 ? DYNAMIC_OVERHEAD + nextLines.length : 0;

        process.stderr.write(`[trim] line ${lineIndex + 1} | ${prevEst} → ${nextEst}\n`);

        trimRef.current = { lineIndex: nextIndex, trimmed: 0 };
        setTrimLineIndex(nextIndex);
        setTrimmedChars(0);
        return nextLines;
      });
    }, CHAR_TRIM_MS);

    return () => clearInterval(interval);
  }, [phase, trimLineIndex]);

  const visibleLines = useMemo(() => {
    return dynamicLines.map((line, index) => {
      if (index !== trimLineIndex || phase !== "shrinking") {
        return line;
      }

      return line.slice(0, Math.max(0, line.length - trimmedChars));
    });
  }, [dynamicLines, trimLineIndex, trimmedChars, phase]);

  const lineCount = visibleLines.length;
  const estInteractive = lineCount > 0 ? lineCount + DYNAMIC_OVERHEAD : 0;

  useInput((input) => {
    if (input === "q") {
      exit();
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

      {lineCount > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold>Ink A3 · {phase}</Text>
          <Text dimColor>
            已 {lineCount} 行 dynamic（interactive ≈{estInteractive} 行
            {estInteractive > rows
              ? " 超屏"
              : estInteractive === rows
                ? " 满屏"
                : " 未超屏"}
            ）| 1s -{CHAR_TRIM_STEP} | q
          </Text>
          {visibleLines.map((line, index) => (
            <Text key={`${index}-${line.length}`}>{line}</Text>
          ))}
        </Box>
      )}
    </Box>
  );
};

render(<App />);
