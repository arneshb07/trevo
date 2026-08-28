import { useState, useEffect, useCallback } from 'react';
import {
  NavigationTab,
  BusinessState,
  DecisionPlan,
  HistoryEntry,
  DecisionEngineResponse,
} from './types';
import {
  baselineBusinessState,
  baselineDecisionPlan,
  shockBusinessState,
  shockDecisionPlan,
  mockHistoryEntries,
} from './mock/index';
import { api, ApiError } from './services/api';
import {
  getSummaryMetricsViewModel,
  getInvoiceViewModels,
  getDecisionUpdateViewModel,
  getHistoryViewModels,
  engineToDecisionPlan,
  engineToForecastMilestones,
  normalizeBusinessState,
  historyApiToEntries,
} from './adapters/viewModelAdapters';
import { Header } from './components/common/Header';
import { BottomNav } from './components/navigation/BottomNav';
import { OverviewScreen } from './components/screens/OverviewScreen';
import { DecisionsScreen } from './components/screens/DecisionsScreen';
import { HistoryScreen } from './components/screens/HistoryScreen';

export function App() {
  // Canonical State from origin/feat/frontend-core
  const [businessState, setBusinessState] = useState<BusinessState>(baselineBusinessState);
  const [engineResponse, setEngineResponse] = useState<DecisionEngineResponse | null>(null);
  const [decisionPlan, setDecisionPlan] = useState<DecisionPlan>(baselineDecisionPlan);
  const [comparisonPlan, setComparisonPlan] = useState<DecisionPlan>(baselineDecisionPlan);
  const [history, setHistory] = useState<HistoryEntry[]>(mockHistoryEntries);
  const [mode, setMode] = useState<'live' | 'demo'>('demo');
  const [hasDecisionChange, setHasDecisionChange] = useState(false);
  const [isSimulationLoading, setIsSimulationLoading] = useState(false);
  const [simulationError, setSimulationError] = useState<string>();
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [voiceError, setVoiceError] = useState<string>();
  const [voiceText, setVoiceText] = useState<string>();
  const [voiceExplanation, setVoiceExplanation] = useState<string>();
  const [counterfactualData, setCounterfactualData] = useState<import('./types').CounterfactualResponse | null>(null);
  const [isCounterfactualLoading, setIsCounterfactualLoading] = useState(false);
  const [counterfactualError, setCounterfactualError] = useState<string>();

  // UI Navigation State
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');

  // Load initial backend data or fall back to canonical mock baseline
  const loadInitialData = useCallback(async () => {
    try {
      const state = await api.getState();
      const decisions = await api.getDecisions();

      if (state && decisions && decisions.invoices) {
        setBusinessState(normalizeBusinessState(state));
        setEngineResponse(decisions);
        setDecisionPlan(engineToDecisionPlan(decisions));
        setComparisonPlan(engineToDecisionPlan(decisions));
        setHasDecisionChange(Object.values(decisions.invoices).some((decision) => baselineDecisionPlan.decisions.find((baseline) => baseline.invoice_id === decision.payable_id)?.selected_action !== decision.selected_action));
        setMode('live');

        try {
          const remoteHistory = await api.getHistory();
          if (remoteHistory && Array.isArray(remoteHistory.history)) {
            setHistory(historyApiToEntries(remoteHistory));
          }
        } catch {
          // Graceful fallback for history
        }
      }
    } catch {
      // Backend not running - use canonical mock baseline
      setBusinessState(baselineBusinessState);
      setDecisionPlan(baselineDecisionPlan);
      setHistory(mockHistoryEntries);
      setMode('demo');
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle Event Simulation (Shock)
  const handleRunSimulation = async (day: number, receivableId: string) => {
    setIsSimulationLoading(true);
    setSimulationError(undefined);

    if (mode === 'live') {
      try {
        const response = await api.postEvent({
          type: 'RECEIVABLE_DELAY',
          invoice_id: receivableId,
          new_day: day,
        });

        if (!response.new_decisions) {
          throw new Error('Event response did not include an updated plan.');
        }

        setEngineResponse(response.new_decisions);
        setComparisonPlan(engineToDecisionPlan(response.previous_decisions));
        setDecisionPlan(engineToDecisionPlan(response.new_decisions));
        setHasDecisionChange(response.changes.length > 0);
        setBusinessState(normalizeBusinessState(await api.getState()));

        try {
          const updatedHistory = await api.getHistory();
          if (updatedHistory && Array.isArray(updatedHistory.history)) {
            setHistory(historyApiToEntries(updatedHistory));
          }
        } catch {
          // Keep current history
        }

      } catch (err: unknown) {
        console.warn('Backend event failed:', err instanceof ApiError ? err.message : err);
        setSimulationError('The event could not be applied. Current backend state is unchanged.');
        setHasDecisionChange(false);
      }
    } else {
      // Demo Mode deterministic transition
      setBusinessState(shockBusinessState);
      setDecisionPlan(shockDecisionPlan);
      setComparisonPlan(baselineDecisionPlan);
      setHasDecisionChange(true);
    }

    setIsSimulationLoading(false);
    setActiveTab('decisions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Reset to Baseline (No confirmation dialog, immediate reset)
  const handleResetToBaseline = async () => {
    setActiveTab('overview');

    if (mode === 'live') {
      try {
        await loadInitialData();
        setHasDecisionChange(false);
      } catch {
        setBusinessState(baselineBusinessState);
        setDecisionPlan(baselineDecisionPlan);
      }
    } else {
      setBusinessState(baselineBusinessState);
      setDecisionPlan(baselineDecisionPlan);
      setComparisonPlan(baselineDecisionPlan);
      setHasDecisionChange(false);
    }
  };

  const handleExplainVoice = async () => {
    setIsVoiceLoading(true);
    setVoiceError(undefined);
    try {
      const response = await api.explainVoice('INV-B');
      setVoiceExplanation(response.text);
      if (response.audio) {
        setVoiceText(response.audio);
      } else {
        setVoiceError('Narration is unavailable. The text explanation remains available above.');
      }
    } catch {
      setVoiceError('Narration is unavailable. The text explanation remains available above.');
    } finally {
      setIsVoiceLoading(false);
    }
  };

  const handleLoadCounterfactual = async () => {
    setIsCounterfactualLoading(true);
    setCounterfactualError(undefined);
    try {
      setCounterfactualData(await api.getCounterfactual('INV-B'));
    } catch {
      setCounterfactualData(null);
      setCounterfactualError('Counterfactual sweep is unavailable from the current backend.');
    } finally {
      setIsCounterfactualLoading(false);
    }
  };

  // Compute ViewModels from Canonical State
  const summaryMetricsVM = getSummaryMetricsViewModel(businessState, decisionPlan, engineResponse || undefined);
  const invoiceVMs = getInvoiceViewModels(businessState, decisionPlan);
  const decisionUpdateVM = getDecisionUpdateViewModel(
    comparisonPlan,
    decisionPlan,
    businessState
  );
  if (engineResponse) {
    decisionUpdateVM.forecastMilestones = engineToForecastMilestones(engineResponse);
    decisionUpdateVM.liquidityBuffer = engineResponse.summary.buffer;
  }
  const historyVMs = getHistoryViewModels(history);

  return (
    <div className="app-container">
      {/* Top Header with Clickable Logo (Immediate Baseline Reset) */}
      <Header
        onResetToBaseline={handleResetToBaseline}
        showTitleGroup={activeTab === 'overview'}
        title="Working Capital"
        subtitle="Real-time overview of deployed capital and liquidity."
      />

      {/* Main View Area */}
      <main>
        {activeTab === 'overview' && (
          <OverviewScreen
            metrics={summaryMetricsVM}
            invoices={invoiceVMs}
            businessState={businessState}
            onRunSimulation={handleRunSimulation}
            isSimulationLoading={isSimulationLoading}
            simulationError={simulationError}
          />
        )}

        {activeTab === 'decisions' && (
          <DecisionsScreen
            decisionData={decisionUpdateVM}
            onBackToOverview={() => setActiveTab('overview')}
            onExplainVoice={handleExplainVoice}
            isVoiceLoading={isVoiceLoading}
            voiceError={voiceError}
            voiceText={voiceText}
            voiceExplanation={voiceExplanation}
            counterfactualData={counterfactualData}
            isCounterfactualLoading={isCounterfactualLoading}
            onLoadCounterfactual={handleLoadCounterfactual}
            counterfactualError={counterfactualError}
            hasDecisionChange={hasDecisionChange}
          />
        )}

        {activeTab === 'history' && (
          <HistoryScreen
            historyItems={historyVMs}
            onSelectHistoryItem={() => setActiveTab('decisions')}
          />
        )}
      </main>

      {/* Floating Bottom Navigation Pill */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;
