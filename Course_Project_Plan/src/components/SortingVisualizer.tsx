import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createAlgorithm } from '../algorithms';
import { useVisualizerContext } from '../context/VisualizerContext';
import { MAX_STEPS, MAX_VISUAL_ELEMENTS } from '../utils/constants';
import {
  SortingAlgorithmType,
  type SortStep,
} from '../types';

interface SortingVisualizerProps {
  algorithmType: SortingAlgorithmType;
  inputData: number[];
  speed: number;
}

interface ExternalVisualizerState {
  chunks: number[][];
  memoryChunk?: { chunkId: number; data: number[] };
  comparison?: { candidates: number[]; winner: number };
}

const initialExternalState: ExternalVisualizerState = {
  chunks: [],
  memoryChunk: undefined,
  comparison: undefined,
};

const SortingVisualizer = ({
  algorithmType,
  inputData,
  speed,
}: SortingVisualizerProps) => {
  const {
    registerHandlers,
    setVisualizerState,
    currentStep,
    totalSteps,
  } = useVisualizerContext();
  const [displayArray, setDisplayArray] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );
  const [externalState, setExternalState] = useState<ExternalVisualizerState>(
    initialExternalState,
  );
  const [activeIndices, setActiveIndices] = useState<number[]>([]);
  const [focusIndices, setFocusIndices] = useState<number[]>([]);

  const stepsRef = useRef<SortStep[]>([]);
  const currentStepRef = useRef(0);
  const arrayRef = useRef<number[]>([]);
  const externalRef = useRef<ExternalVisualizerState>(initialExternalState);
  const timerRef = useRef<number | null>(null);
  const playingRef = useRef(false);
  const originalDataRef = useRef<number[]>([]);

  const isExternal = useMemo(
    () => algorithmType === SortingAlgorithmType.ExternalMerge,
    [algorithmType],
  );

  const stopPlayback = useCallback(() => {
    playingRef.current = false;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

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

      if (!animate && (step.type === 'swap' || step.type === 'overwrite')) {
        // keep arrayRef updated without triggering React state until final setDisplay.
      }
    },
    [],
  );

  const rebuildToStep = useCallback(
    (targetStep: number) => {
      arrayRef.current = [...originalDataRef.current];
      externalRef.current = initialExternalState;
      for (let index = 0; index < targetStep; index += 1) {
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
    if (!playingRef.current) {
      return;
    }
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

    applyStepMutation(step, true);
    currentStepRef.current += 1;
    setVisualizerState({
      currentStep: currentStepRef.current,
      totalSteps: stepsRef.current.length,
    });

    timerRef.current = window.setTimeout(
      () => requestAnimationFrame(tick),
      Math.max(1, speed),
    );
  }, [applyStepMutation, setVisualizerState, speed, stopPlayback]);

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
    rebuildToStep(0);
    setVisualizerState({ status: 'ready', currentStep: 0 });
  }, [rebuildToStep, setVisualizerState]);

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
      stepsRef.current = steps;
      currentStepRef.current = 0;
      externalRef.current = initialExternalState;
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
      const message =
        error instanceof Error ? error.message : '可视化初始化失败';
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

  const progressPercent = useMemo(() => {
    if (!totalSteps) return 0;
    return (currentStep / totalSteps) * 100;
  }, [currentStep, totalSteps]);

  const bars = useMemo(() => {
    const denominator = Math.max(
      ...(displayArray.length ? displayArray : [1]),
    );
    return displayArray.map((value, index) => {
      const isActive = activeIndices.includes(index);
      const isFocus = focusIndices.includes(index);
      const height = `${(value / denominator) * 100}%`;
      const className = [
        'bar',
        isActive ? 'bar--active' : '',
        isFocus ? 'bar--swap' : '',
      ]
        .join(' ')
        .trim();
      return (
        <div
          key={`${value}-${index}`}
          className={className}
          style={{ height }}
        >
          <span>{value}</span>
        </div>
      );
    });
  }, [activeIndices, displayArray, focusIndices]);

  const renderExternalView = () => (
    <div className="external-view">
      <div className="memory-area">
        <h4>内存缓冲区</h4>
        {externalState.memoryChunk ? (
          <div className="memory-chunk">
            <strong>块 #{externalState.memoryChunk.chunkId}</strong>
            <div className="chunk-values">
              {externalState.memoryChunk.data.map((value, index) => (
                <span key={`${value}-${index}`}>{value}</span>
              ))}
            </div>
          </div>
        ) : (
          <p>尚未加载数据块</p>
        )}
      </div>
      <div className="disk-area">
        <h4>磁盘分块</h4>
        {externalState.chunks.map((chunk, chunkId) => (
          <div className="disk-chunk" key={`chunk-${chunkId}`}>
            <strong>块 #{chunkId}</strong>
            <div className="chunk-values">
              {chunk.map((value, index) => {
                const isWinner =
                  externalState.comparison?.winner === chunkId &&
                  externalState.comparison?.candidates.includes(chunkId) &&
                  externalState.comparison?.winner === chunkId;
                return (
                  <span
                    key={`${value}-${chunkId}-${index}`}
                    className={isWinner ? 'disk-value--winner' : undefined}
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

  return (
    <section className="visualizer-panel">
      <header className="visualizer-header">
        <div>
          <h2>算法动画展示</h2>
          <p>{algorithmType}</p>
        </div>
        <div className="progress">
          <div className="progress-bar">
            <div
              className="progress-value"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span>
            {currentStep}/{totalSteps} 步
          </span>
        </div>
      </header>
      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      <div className="visualizer-body">
        {isExternal ? renderExternalView() : (
          <div className="bars-container">{bars}</div>
        )}
      </div>
    </section>
  );
};

export default SortingVisualizer;
