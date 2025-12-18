import Dashboard from './components/Dashboard';
import BenchmarkReport from './components/BenchmarkReport';
import SortingVisualizer from './components/SortingVisualizer';
import { useSortingContext } from './context/SortingContext';
import { VisualizerProvider } from './context/VisualizerContext';
import './App.css';

const App = () => {
  const { algorithm, data, speed } = useSortingContext();

  return (
    <VisualizerProvider>
      <main className="app-shell">
        <Dashboard />
        <SortingVisualizer
          algorithmType={algorithm}
          inputData={data}
          speed={speed}
        />
        <BenchmarkReport />
      </main>
    </VisualizerProvider>
  );
};

export default App;
