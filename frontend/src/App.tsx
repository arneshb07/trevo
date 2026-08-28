import { useState, useEffect, useCallback } from 'react';
import {
  NavigationTab,
  BusinessState,
  DecisionPlan,
  HistoryEntry,
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
} from './adapters/viewModelAdapters';
import { Header } from './components/common/Header';
import { BottomNav } from './components/navigation/BottomNav';
import { OverviewScreen } from './components/screens/OverviewScreen';
import { DecisionsScreen } from './components/screens/DecisionsScreen';
import { HistoryScreen } from './components/screens/HistoryScreen';

export function App() {
  // Canonical State from origin/feat/frontend-core
  const [businessState, setBusinessState] = useState<BusinessState>(baselineBusinessState);
  const [decisionPlan, setDecisionPlan] = useState<DecisionPlan>(baselineDecisionPlan);
  const [history, setHistory] = useState<HistoryEntry[]>(mockHistoryEntries);
  const [mode, setMode] = useState<'live' | 'demo'>('demo');
  const [isShockActive, setIsShockActive] = useState<boolean>(false);
  const [simulationDay, setSimulationDay] = useState<number>(20);

  // UI Navigation State
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');

  // Load initial backend data or fall back to canonical mock baseline
  const loadInitialData = useCallback(async () => {
    try {
      const state = await api.getState();
      const decisions = await api.getDecisions();

      if (state && Array.isArray(decisions)) {
        setBusinessState(state);
        setDecisionPlan({
          decisions,
          total_cost: decisions.reduce((sum, d) => sum + (d.cost || 0), 0),
          timestamp: new Date().toISOString(),
        });
        setMode('live');

        try {
          const remoteHistory = await api.getHistory();
          if (Array.isArray(remoteHistory)) {
            setHistory(remoteHistory);
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
  const handleRunSimulation = async (day: number) => {
    setSimulationDay(day);

    if (mode === 'live') {
      try {
        const response = await api.postEvent({
          type: 'RECEIVABLE_DELAY',
          receivable_id: 'AR-Y',
          new_expected_day: day,
        });

        if (response.new_plan) {
          setDecisionPlan(response.new_plan);
        }
        if (response.updated_state) {
          setBusinessState(response.updated_state);
        } else {
          setBusinessState((prev) => ({
            ...prev,
            receivables: prev.receivables.map((r) =>
              r.id === 'AR-Y' ? { ...r, expected_day: day, late_day: day } : r
            ),
          }));
        }

        try {
          const updatedHistory = await api.getHistory();
          if (Array.isArray(updatedHistory)) {
            setHistory(updatedHistory);
          }
        } catch {
          // Keep current history
        }

        setIsShockActive(true);
      } catch (err: unknown) {
        console.warn('Backend event failed, using canonical mock shock:', err instanceof ApiError ? err.message : err);
        setBusinessState(shockBusinessState);
        setDecisionPlan(shockDecisionPlan);
        setIsShockActive(true);
      }
    } else {
      // Demo Mode deterministic transition
      setBusinessState(shockBusinessState);
      setDecisionPlan(shockDecisionPlan);
      setIsShockActive(true);
    }

    setActiveTab('decisions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Reset to Baseline (No confirmation dialog, immediate reset)
  const handleResetToBaseline = async () => {
    setActiveTab('overview');

    if (mode === 'live') {
      try {
        await api.postOptimize();
        await loadInitialData();
        setIsShockActive(false);
      } catch {
        setBusinessState(baselineBusinessState);
        setDecisionPlan(baselineDecisionPlan);
        setIsShockActive(false);
      }
    } else {
      setBusinessState(baselineBusinessState);
      setDecisionPlan(baselineDecisionPlan);
      setIsShockActive(false);
    }
  };

  // Compute ViewModels from Canonical State
  const summaryMetricsVM = getSummaryMetricsViewModel(businessState, decisionPlan);
  const invoiceVMs = getInvoiceViewModels(businessState, decisionPlan);
  const decisionUpdateVM = getDecisionUpdateViewModel(
    baselineDecisionPlan,
    isShockActive ? decisionPlan : shockDecisionPlan,
    businessState,
    simulationDay
  );
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
            onRunSimulation={handleRunSimulation}
          />
        )}

        {activeTab === 'decisions' && (
          <DecisionsScreen
            decisionData={decisionUpdateVM}
            onBackToOverview={() => setActiveTab('overview')}
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
