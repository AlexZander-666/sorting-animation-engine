import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';

type VisualizerStatus =
  | 'idle'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'completed'
  | 'error';

interface VisualizerHandlers {
  play?: () => void;
  pause?: () => void;
  reset?: () => void;
  seek?: (step: number) => void;
}

interface VisualizerStateShape {
  status: VisualizerStatus;
  currentStep: number;
  totalSteps: number;
  error?: string;
}

interface VisualizerContextValue extends VisualizerStateShape {
  registerHandlers: (handlers: VisualizerHandlers) => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  seek: (step: number) => void;
  setVisualizerState: (state: Partial<VisualizerStateShape>) => void;
}

const VisualizerContext = createContext<VisualizerContextValue | null>(null);

export const VisualizerProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<VisualizerStatus>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [error, setError] = useState<string | undefined>(undefined);
  const handlerRef = useRef<VisualizerHandlers>({});

  const registerHandlers = (handlers: VisualizerHandlers) => {
    handlerRef.current = handlers;
  };

  const invoke = (action: keyof VisualizerHandlers, payload?: number) => {
    const handler = handlerRef.current[action];
    if (action === 'seek') {
      const seekHandler = handler as ((step: number) => void) | undefined;
      seekHandler?.(payload ?? 0);
      return;
    }
    const simpleHandler = handler as (() => void) | undefined;
    simpleHandler?.();
  };

  const setVisualizerState = useCallback<
    VisualizerContextValue['setVisualizerState']
  >(
    (state) => {
      if (state.status) setStatus(state.status);
      if (typeof state.currentStep === 'number')
        setCurrentStep(state.currentStep);
      if (typeof state.totalSteps === 'number')
        setTotalSteps(state.totalSteps);
      if (state.error !== undefined) setError(state.error);
    },
    [],
  );

  const value = useMemo<VisualizerContextValue>(
    () => ({
      status,
      currentStep,
      totalSteps,
      error,
      registerHandlers,
      play: () => invoke('play'),
      pause: () => invoke('pause'),
      reset: () => invoke('reset'),
      seek: (step: number) => invoke('seek', step),
      setVisualizerState,
    }),
    [currentStep, error, status, totalSteps, setVisualizerState],
  );

  return (
    <VisualizerContext.Provider value={value}>
      {children}
    </VisualizerContext.Provider>
  );
};

export const useVisualizerContext = () => {
  const context = useContext(VisualizerContext);
  if (!context) {
    throw new Error(
      'useVisualizerContext must be used within VisualizerProvider',
    );
  }
  return context;
};
