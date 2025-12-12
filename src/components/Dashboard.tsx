import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useSortingContext } from '../context/SortingContext';
import { useVisualizerContext } from '../context/VisualizerContext';
import {
  MAX_VISUAL_ELEMENTS,
  MAX_VALUE,
  MIN_VALUE,
} from '../utils/constants';
import {
  generateRandomArray,
  sanitizeInput,
} from '../utils/data';
import { SortingAlgorithmType } from '../types';

const datasetOptions = [10, 30, 50, 100, 200, 500];

const Dashboard = () => {
  const {
    data,
    setData,
    datasetSize,
    setDatasetSize,
    algorithm,
    setAlgorithm,
    speed,
    setSpeed,
  } = useSortingContext();
  const {
    play,
    pause,
    reset,
    seek,
    status,
    currentStep,
    totalSteps,
  } = useVisualizerContext();

  const [inputValue, setInputValue] = useState(data.join(', '));
  const [error, setError] = useState<string | undefined>(undefined);
  const [selectedSize, setSelectedSize] = useState(datasetSize);

  const algorithmOptions = useMemo(
    () => [
      { label: '冒泡排序', value: SortingAlgorithmType.Bubble },
      { label: '选择排序', value: SortingAlgorithmType.Selection },
      { label: '插入排序', value: SortingAlgorithmType.Insertion },
      { label: '快速排序', value: SortingAlgorithmType.Quick },
      { label: '归并排序', value: SortingAlgorithmType.Merge },
      { label: '堆排序', value: SortingAlgorithmType.Heap },
      { label: '外部归并', value: SortingAlgorithmType.ExternalMerge },
    ],
    [],
  );

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
  };

  const applyParsedData = (rawText: string) => {
    const result = sanitizeInput(rawText);
    if (!result.values.length) {
      setError('请提供至少一个有效数字。');
      return;
    }
    const warnings: string[] = [];
    if (result.droppedCount > 0) {
      warnings.push(`忽略了 ${result.droppedCount} 个非数字内容。`);
    }
    if (result.clampedCount > 0) {
      warnings.push(
        `有 ${result.clampedCount} 个数值被限制在允许范围 ${MIN_VALUE}-${MAX_VALUE} 内。`,
      );
    }
    if (result.values.length > MAX_VISUAL_ELEMENTS) {
      warnings.push(
        `当前输入包含 ${result.values.length} 个元素，超出可视化上限 ${MAX_VISUAL_ELEMENTS}，` +
          '动画播放将被禁用，请切换 Benchmark 模式或缩小数据规模。',
      );
    }
    setError(warnings.length ? warnings.join(' ') : undefined);
    setData(result.values);
    setInputValue(result.values.join(', '));
  };

  const handleApplyInput = () => applyParsedData(inputValue);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('文件过大 (>10MB)，请提供更小的样本。');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result?.toString() ?? '';
      applyParsedData(text);
    };
    reader.onerror = () => {
      setError('读取文件失败，请重试。');
    };
    reader.readAsText(file);
  };

  const handleRandomGenerate = () => {
    const values = generateRandomArray(selectedSize);
    setError(undefined);
    setData(values);
    setInputValue(values.join(', '));
  };

  return (
    <section className="dashboard-panel">
      <header>
        <h2>数据与控制面板</h2>
        <p>
          当前元素个数：{data.length} （可视化上限 {MAX_VISUAL_ELEMENTS}，
          数值区间 {MIN_VALUE}-{MAX_VALUE}）
        </p>
      </header>
      <div className="dashboard-grid">
        <div className="panel">
          <h3>数据源</h3>
          <textarea
            value={inputValue}
            onChange={handleInputChange}
            placeholder="例如：5,12,8,3"
          />
          <div className="actions">
            <button type="button" onClick={handleApplyInput}>
              应用输入
            </button>
            <label className="file-upload">
              导入 CSV/TXT
              <input
                type="file"
                accept=".txt,.csv"
                onChange={handleFileChange}
              />
            </label>
          </div>
          {error ? <p className="error-text">{error}</p> : null}
          <div className="random-controls">
            <select
              value={selectedSize}
              onChange={(event) => {
                const size = Number(event.target.value);
                setSelectedSize(size);
                setDatasetSize(size);
              }}
            >
              {datasetOptions.map((size) => (
                <option key={size} value={size}>
                  {size} 个元素
                </option>
              ))}
            </select>
            <button type="button" onClick={handleRandomGenerate}>
              随机生成
            </button>
          </div>
        </div>
        <div className="panel">
          <h3>算法与播放控制</h3>
          <div className="algorithm-list">
            {algorithmOptions.map((item) => (
              <label key={item.value}>
                <input
                  type="radio"
                  name="algorithm"
                  value={item.value}
                  checked={algorithm === item.value}
                  onChange={() => setAlgorithm(item.value)}
                />
                {item.label}
              </label>
            ))}
          </div>
          <div className="controls">
            <button type="button" onClick={play}>
              开始
            </button>
            <button type="button" onClick={pause}>
              暂停
            </button>
            <button type="button" onClick={reset}>
              重置
            </button>
          </div>
          <div className="slider-control">
            <label htmlFor="speed">速度 (ms): {speed}</label>
            <input
              id="speed"
              type="range"
              min={20}
              max={1000}
              step={10}
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
            />
          </div>
          <div className="progress-state">
            <p>状态：{status}</p>
            <p>
              步骤：{currentStep}/{totalSteps}
            </p>
            <input
              type="range"
              min={0}
              max={totalSteps || 0}
              value={currentStep}
              onChange={(event) => seek(Number(event.target.value))}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
