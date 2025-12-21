import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createAlgorithm } from '../algorithms';
import { useVisualizerContext } from '../context/VisualizerContext';
import { MAX_STEPS, MAX_VISUAL_ELEMENTS, MEMORY_LIMIT } from '../utils/constants';
import { getAlgorithmLabel } from '../utils/labels';
import { SortingAlgorithmType, type SortStep } from '../types';

interface SortingVisualizerProps {
  algorithmType: SortingAlgorithmType;
  inputData: number[];
  speed: number;
}

interface ExternalVisualizerState {
  chunks: number[][];
  memoryChunk?: { chunkId: number; data: number[] };
  comparison?: { candidates: number[]; winner: number };
  lastWrite?: { chunkId: number; index: number; value: number };
}

const initialExternalState: ExternalVisualizerState = {
  chunks: [],
  memoryChunk: undefined,
  comparison: undefined,
};

const COMPARE_BATCH_LIMIT = 10;
const SNAPSHOT_INTERVAL = 500;

interface BarRenderData {
  index: number;
  value: number;
  isActive: boolean;
  isFocus: boolean;
}

interface PlaybackState {
  algorithmLabel: string;
  isExternal: boolean;
  errorMessage?: string;
  displayArray: number[];
  activeIndices: number[];
  focusIndices: number[];
  externalState: ExternalVisualizerState;
  progressPercent: number;
  currentStep: number;
  totalSteps: number;
  totalElements: number;
  initialChunkCount: number;
  isDownsampled: boolean;
}

const ExternalVisualizer = ({
  externalState,
  initialChunkCount,
  totalElements,
}: {
  externalState: ExternalVisualizerState;
  initialChunkCount: number;
  totalElements: number;
}) => {
  const outputChunk = externalState.chunks[initialChunkCount];
  const filledOutput =
    outputChunk?.filter((value) => value !== undefined).length ?? 0;
  const outputProgress =
    totalElements === 0 ? 0 : Math.min(100, (filledOutput / totalElements) * 100);

  return (
    <div className="external-view">
      <div className="memory-area">
        <h4>内存缓冲区</h4>
        <p className="note-text">
          块容量上限：{MEMORY_LIMIT}，当前块：
          {externalState.memoryChunk ? `#${externalState.memoryChunk.chunkId}` : '无'}
        </p>
        <div className="memory-usage">
          <div className="memory-meter">
            <div
              className="memory-meter__value"
              style={{
                width: `${Math.min(
                  100,
                  ((externalState.memoryChunk?.data.length ?? 0) / MEMORY_LIMIT) *
                    100,
                )}%`,
              }}
            />
          </div>
          <span>
            {externalState.memoryChunk?.data.length ?? 0}/{MEMORY_LIMIT}
          </span>
        </div>
        {externalState.memoryChunk ? (
          <div className="memory-chunk">
            <strong>块 #{externalState.memoryChunk.chunkId}</strong>
            <div className="chunk-values">
              {externalState.memoryChunk.data.map((value, index) => (
                <span key={`memory-${externalState.memoryChunk?.chunkId ?? 0}-${index}`}>
                  {value}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p>尚未加载数据块</p>
        )}
      </div>
      <div className="disk-area">
        <div className="disk-area__header">
          <h4>磁盘分块</h4>
          <span>
            输入块数：{initialChunkCount}，输出块：
            {externalState.chunks.length > initialChunkCount
              ? `#${initialChunkCount}`
              : '尚未生成'}
          </span>
        </div>
        {externalState.lastWrite ? (
          <p className="note-text">
            最新写入 → 块 #{externalState.lastWrite.chunkId} @ 索引{' '}
            {externalState.lastWrite.index}，值 {externalState.lastWrite.value}
          </p>
        ) : null}
        <div className="output-progress" aria-label="output-progress">
          <div className="output-progress__bar">
            <div
              className="output-progress__value"
              style={{ width: `${outputProgress}%` }}
            />
          </div>
          <span>
            输出进度：{filledOutput}/{totalElements}
          </span>
        </div>
        {externalState.chunks.map((chunk, chunkId) => (
          <div
            className={[
              'disk-chunk',
              chunkId === initialChunkCount &&
              externalState.chunks.length > initialChunkCount
                ? 'disk-chunk--output'
                : '',
            ]
              .join(' ')
              .trim()}
            key={`chunk-${chunkId}`}
          >
            <strong>
              {chunkId === initialChunkCount &&
              externalState.chunks.length > initialChunkCount
                ? '输出块'
                : `块 #${chunkId}`}
            </strong>
            <div className="chunk-values">
              {chunk.map((value, index) => {
                const isCandidate =
                  externalState.comparison?.candidates?.includes(chunkId) ?? false;
                const isWinner = externalState.comparison?.winner === chunkId;
                const className = [
                  isWinner ? 'disk-value--winner' : '',
                  isCandidate ? 'disk-value--candidate' : '',
                ]
                  .join(' ')
                  .trim();
                return (
                  <span
                    key={`chunk-${chunkId}-${index}`}
                    className={className || undefined}
                  >
                    {value}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const useSortingPlayback = ({
  algorithmType,
  inputData,
  speed,
}: SortingVisualizerProps): PlaybackState => {
  const {
    registerHandlers,
    setVisualizerState,
    currentStep,
    totalSteps,
  } = useVisualizerContext();
  const [displayArray, setDisplayArray] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [externalState, setExternalState] = useState<ExternalVisualizerState>(
    initialExternalState,
  );
  const [activeIndices, setActiveIndices] = useState<number[]>([]);
  const [focusIndices, setFocusIndices] = useState<number[]>([]);

  const stepsRef = useRef<SortStep[]>([]);
  const currentStepRef = useRef(0);
  const arrayRef = useRef<number[]>([]);
  const speedRef = useRef(speed);
  const externalRef = useRef<ExternalVisualizerState>(initialExternalState);
  const initialChunkCountRef = useRef(0);
  const snapshotsRef = useRef<
    { step: number; array: number[]; external: ExternalVisualizerState }[]
  >([]);
  const timeoutRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const playingRef = useRef(false);
  const originalDataRef = useRef<number[]>([]);
  const totalElementsRef = useRef(0);

  const isExternal = useMemo(
    () => algorithmType === SortingAlgorithmType.ExternalMerge,
    [algorithmType],
  );
  const algorithmLabel = useMemo(
    () => getAlgorithmLabel(algorithmType),
    [algorithmType],
  );

  const clearTimers = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const stopPlayback = useCallback(() => {
    playingRef.current = false;
    clearTimers();
  }, [clearTimers]);

  const applyStepMutation = useCallback(
    (step: SortStep, animate = true) => {
      switch (step.type) {
        case 'compare':
          if (animate) {
            setActiveIndices(step.indices);
            setFocusIndices([]);
          }
          break;
        case 'swap': {
          const [i, j] = step.indices;
          [arrayRef.current[i], arrayRef.current[j]] = [
            arrayRef.current[j],
            arrayRef.current[i],
          ];
          if (animate) {
            setDisplayArray([...arrayRef.current]);
            setFocusIndices(step.indices);
          }
          break;
        }
        case 'overwrite': {
          arrayRef.current[step.index] = step.value;
          if (animate) {
            setDisplayArray([...arrayRef.current]);
            setFocusIndices([step.index]);
          }
          break;
        }
        case 'splitToChunks': {
          initialChunkCountRef.current = step.chunks.length;
          const nextState: ExternalVisualizerState = {
            chunks: step.chunks.map((chunk) => [...chunk]),
          };
          externalRef.current = nextState;
          if (animate) setExternalState(nextState);
          break;
        }
        case 'loadChunkToMemory': {
          const nextState: ExternalVisualizerState = {
            ...externalRef.current,
            memoryChunk: {
              chunkId: step.chunkId,
              data: [...step.data],
            },
            comparison: undefined,
          };
          externalRef.current = nextState;
          if (animate) setExternalState(nextState);
          break;
        }
        case 'writeToDisk': {
          const chunks = externalRef.current.chunks.map((chunk) => [...chunk]);
          if (!chunks[step.chunkId]) {
            chunks[step.chunkId] = [];
          }
          chunks[step.chunkId][step.index] = step.value;
          const nextState: ExternalVisualizerState = {
            ...externalRef.current,
            chunks,
            lastWrite: {
              chunkId: step.chunkId,
              index: step.index,
              value: step.value,
            },
          };
          externalRef.current = nextState;
          if (animate) setExternalState(nextState);
          break;
        }
        case 'comparisonDetails': {
          const nextState: ExternalVisualizerState = {
            ...externalRef.current,
            comparison: {
              candidates: step.indices,
              winner: step.winnerIndex,
            },
          };
          externalRef.current = nextState;
          if (animate) setExternalState(nextState);
          break;
        }
        default:
          break;
      }
    },
    [],
  );

  const rebuildToStep = useCallback(
    (targetStep: number) => {
      let baseSnapshot =
        snapshotsRef.current[snapshotsRef.current.length - 1] ?? undefined;
      for (let index = snapshotsRef.current.length - 1; index >= 0; index -= 1) {
        if (snapshotsRef.current[index].step <= targetStep) {
          baseSnapshot = snapshotsRef.current[index];
          break;
        }
      }

      if (baseSnapshot && baseSnapshot.step <= targetStep) {
        arrayRef.current = [...baseSnapshot.array];
        externalRef.current = {
          chunks: baseSnapshot.external.chunks.map((chunk) => [...chunk]),
          memoryChunk: baseSnapshot.external.memoryChunk
            ? {
                chunkId: baseSnapshot.external.memoryChunk.chunkId,
                data: [...baseSnapshot.external.memoryChunk.data],
              }
            : undefined,
          comparison: baseSnapshot.external.comparison
            ? { ...baseSnapshot.external.comparison }
            : undefined,
          lastWrite: baseSnapshot.external.lastWrite
            ? { ...baseSnapshot.external.lastWrite }
            : undefined,
        };
      } else {
        arrayRef.current = [...originalDataRef.current];
        externalRef.current = initialExternalState;
      }

      const startIndex = baseSnapshot?.step ?? 0;
      for (let index = startIndex; index < targetStep; index += 1) {
        const step = stepsRef.current[index];
        if (step) {
          applyStepMutation(step, false);
        }
      }

      setDisplayArray([...arrayRef.current]);
      setExternalState({ ...externalRef.current });
      setActiveIndices([]);
      setFocusIndices([]);
      currentStepRef.current = targetStep;
      setVisualizerState({
        currentStep: targetStep,
        status: targetStep === stepsRef.current.length ? 'completed' : 'paused',
        totalSteps: stepsRef.current.length,
      });
    },
    [applyStepMutation, setVisualizerState],
  );

  const tick = useCallback(() => {
    if (!playingRef.current) return;

    let processed = 0;
    let lastCompareIndices: number[] | null = null;

    while (playingRef.current) {
      const step = stepsRef.current[currentStepRef.current];
      if (!step) {
        stopPlayback();
        setVisualizerState({
          status: 'completed',
          currentStep: stepsRef.current.length,
          totalSteps: stepsRef.current.length,
        });
        return;
      }

      if (step.type === 'compare' && processed < COMPARE_BATCH_LIMIT) {
        lastCompareIndices = step.indices;
        currentStepRef.current += 1;
        processed += 1;
        continue;
      }

      applyStepMutation(step, true);
      currentStepRef.current += 1;
      break;
    }

    if (lastCompareIndices) {
      setActiveIndices(lastCompareIndices);
      setFocusIndices([]);
    }

    if (currentStepRef.current % SNAPSHOT_INTERVAL === 0 && currentStepRef.current) {
      snapshotsRef.current.push({
        step: currentStepRef.current,
        array: [...arrayRef.current],
        external: {
          chunks: externalRef.current.chunks.map((chunk) => [...chunk]),
          memoryChunk: externalRef.current.memoryChunk
            ? {
                chunkId: externalRef.current.memoryChunk.chunkId,
                data: [...externalRef.current.memoryChunk.data],
              }
            : undefined,
          comparison: externalRef.current.comparison
            ? { ...externalRef.current.comparison }
            : undefined,
          lastWrite: externalRef.current.lastWrite
            ? { ...externalRef.current.lastWrite }
            : undefined,
        },
      });
    }

    setVisualizerState({
      currentStep: currentStepRef.current,
      totalSteps: stepsRef.current.length,
    });

    clearTimers();
    const delay = Math.max(1, speedRef.current);
    timeoutRef.current = window.setTimeout(() => {
      rafRef.current = window.requestAnimationFrame(tick);
    }, delay);
  }, [applyStepMutation, clearTimers, setVisualizerState, stopPlayback]);

  const handlePlay = useCallback(() => {
    if (stepsRef.current.length === 0) return;
    if (currentStepRef.current >= stepsRef.current.length) {
      rebuildToStep(0);
    }
    playingRef.current = true;
    setVisualizerState({ status: 'playing' });
    tick();
  }, [rebuildToStep, setVisualizerState, tick]);

  const handlePause = useCallback(() => {
    stopPlayback();
    setVisualizerState({ status: 'paused' });
  }, [setVisualizerState, stopPlayback]);

  const handleReset = useCallback(() => {
    stopPlayback();
    rebuildToStep(0);
    setVisualizerState({ status: 'ready', currentStep: 0 });
  }, [rebuildToStep, setVisualizerState, stopPlayback]);

  const handleSeek = useCallback(
    (step: number) => {
      stopPlayback();
      const clamped = Math.max(0, Math.min(step, stepsRef.current.length));
      rebuildToStep(clamped);
    },
    [rebuildToStep, stopPlayback],
  );

  useEffect(() => {
    registerHandlers({
      play: handlePlay,
      pause: handlePause,
      reset: handleReset,
      seek: handleSeek,
    });
  }, [handlePause, handlePlay, handleReset, handleSeek, registerHandlers]);

  useEffect(() => {
    const sanitizedData = inputData.slice(0, MAX_VISUAL_ELEMENTS);
    if (inputData.length > MAX_VISUAL_ELEMENTS) {
      const warning =
        `当前输入包含 ${inputData.length} 个元素，超过可视化上限 ${MAX_VISUAL_ELEMENTS}。` +
        '请切换 Benchmark 模式或减小输入规模。';
      setErrorMessage(warning);
      stepsRef.current = [];
      setVisualizerState({
        status: 'error',
        error: warning,
        totalSteps: 0,
        currentStep: 0,
      });
      return () => stopPlayback();
    }
    setErrorMessage(undefined);
    try {
      const algorithm = createAlgorithm(algorithmType, sanitizedData);
      const steps = algorithm.run(true);
      if (steps.length > MAX_STEPS) {
        throw new Error(
          `生成的动画步骤 (${steps.length}) 超出安全阈值 ${MAX_STEPS}，请改用 Benchmark 模式或缩减输入。`,
        );
      }
      originalDataRef.current = [...sanitizedData];
      arrayRef.current = [...sanitizedData];
      totalElementsRef.current = sanitizedData.length;
      stepsRef.current = steps;
      currentStepRef.current = 0;
      externalRef.current = initialExternalState;
      snapshotsRef.current = [
        {
          step: 0,
          array: [...sanitizedData],
          external: initialExternalState,
        },
      ];
      setDisplayArray([...sanitizedData]);
      setExternalState(initialExternalState);
      setVisualizerState({
        status: 'ready',
        totalSteps: steps.length,
        currentStep: 0,
        error: undefined,
      });
      setActiveIndices([]);
      setFocusIndices([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : '可视化初始化失败';
      setErrorMessage(message);
      setVisualizerState({
        status: 'error',
        error: message,
        totalSteps: 0,
        currentStep: 0,
      });
    }
    return () => stopPlayback();
  }, [algorithmType, inputData, setVisualizerState, stopPlayback]);

  useEffect(() => {
    speedRef.current = speed;
    if (playingRef.current) {
      clearTimers();
      const delay = Math.max(1, speedRef.current);
      timeoutRef.current = window.setTimeout(() => {
        rafRef.current = window.requestAnimationFrame(tick);
      }, delay);
    }
  }, [clearTimers, speed, tick]);

  const progressPercent = useMemo(() => {
    if (!totalSteps) return 0;
    return (currentStep / totalSteps) * 100;
  }, [currentStep, totalSteps]);

  return {
    algorithmLabel,
    isExternal,
    errorMessage,
    displayArray,
    activeIndices,
    focusIndices,
    externalState,
    progressPercent,
    currentStep,
    totalSteps,
    totalElements: totalElementsRef.current,
    initialChunkCount: initialChunkCountRef.current,
    isDownsampled: displayArray.length > 150,
  };
};

const SortingVisualizer = (props: SortingVisualizerProps) => {
  const playback = useSortingPlayback(props);

  const bars: BarRenderData[] = useMemo(() => {
    const targetSize = playback.displayArray.length > 150
      ? Math.ceil(playback.displayArray.length / 2)
      : playback.displayArray.length;
    const step = Math.max(1, Math.ceil(playback.displayArray.length / Math.max(1, targetSize)));

    return playback.displayArray
      .filter((_, idx) => idx % step === 0 || idx === playback.displayArray.length - 1)
      .map((value, filteredIndex) => {
        const originalIndex =
          filteredIndex * step >= playback.displayArray.length
            ? playback.displayArray.length - 1
            : filteredIndex * step;
        return {
          index: originalIndex,
          value,
          isActive: playback.activeIndices.includes(originalIndex),
          isFocus: playback.focusIndices.includes(originalIndex),
        };
      });
  }, [playback.activeIndices, playback.displayArray, playback.focusIndices]);

  const denominator = useMemo(
    () => Math.max(...(playback.displayArray.length ? playback.displayArray : [1])),
    [playback.displayArray],
  );

  return (
    <section className="visualizer-panel">
      <header className="visualizer-header">
        <div>
          <h2>算法动画展示</h2>
          <p>{playback.algorithmLabel}</p>
        </div>
        <div className="progress">
          <div className="progress-bar">
            <div
              className="progress-value"
              style={{ width: `${playback.progressPercent}%` }}
            />
          </div>
          <span>
            {playback.currentStep}/{playback.totalSteps} 步
          </span>
        </div>
      </header>
      {playback.errorMessage ? <p className="error-text">{playback.errorMessage}</p> : null}
      <div className="visualizer-body">
        {playback.isExternal ? (
          <ExternalVisualizer
            externalState={playback.externalState}
            initialChunkCount={playback.initialChunkCount}
            totalElements={playback.totalElements}
          />
        ) : (
          <div className="bars-container">
            {bars.map((bar) => {
              const className = [
                'bar',
                bar.isActive ? 'bar--active' : '',
                bar.isFocus ? 'bar--swap' : '',
              ]
                .join(' ')
                .trim();
              return (
                <div
                  key={bar.index}
                  className={className}
                  style={{ height: `${(bar.value / denominator) * 100}%` }}
                  aria-label={`index-${bar.index}-value-${bar.value}`}
                >
                  <span>{bar.value}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {!playback.isExternal && playback.isDownsampled ? (
        <p className="note-text">
          数据量较大，已按步长降采样展示（保留首尾与等间距索引）。
        </p>
      ) : null}
    </section>
  );
};

export default SortingVisualizer;
