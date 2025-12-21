/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_DATASET_SIZE } from '../utils/constants';
import { generateRandomArray } from '../utils/data';
import {
  SortingAlgorithmType,
  type SortingContextValue,
} from '../types';

const SortingContext = createContext<SortingContextValue | null>(null);

export const SortingProvider = ({ children }: { children: ReactNode }) => {
  const [algorithm, setAlgorithm] = useState<SortingAlgorithmType>(
    SortingAlgorithmType.Quick,
  );
  const [speed, setSpeed] = useState(150);
  const [data, setData] = useState<number[]>(() =>
    generateRandomArray(DEFAULT_DATASET_SIZE),
  );
  const [datasetSize, setDatasetSize] = useState(DEFAULT_DATASET_SIZE);

  const updateData = (values: number[]) => {
    setData([...values]);
    setDatasetSize(values.length);
  };

  const isWorkerSupported = useMemo(
    () => typeof Worker !== 'undefined',
    [],
  );

  const value: SortingContextValue = useMemo(
    () => ({
      algorithm,
      speed,
      data,
      datasetSize,
      isWorkerSupported,
      setAlgorithm,
      setSpeed,
      setData: updateData,
      setDatasetSize,
    }),
    [algorithm, data, datasetSize, isWorkerSupported, speed],
  );

  return (
    <SortingContext.Provider value={value}>
      {children}
    </SortingContext.Provider>
  );
};

export const useSortingContext = () => {
  const context = useContext(SortingContext);

  if (!context) {
    throw new Error('useSortingContext must be used within SortingProvider');
  }

  return context;
};
