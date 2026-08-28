import React, { useState, useEffect, useCallback } from 'react';
import { 
  BusinessState, 
  DecisionPlan, 
  HistoryEntry, 
  CounterfactualResponse 
} from './types';
import { 
  baselineBusinessState, 
  baselineDecisionPlan, 
  shockBusinessState, 
  shockDecisionPlan,
  mockHistoryEntries,
  mockCounterfactuals
} from './mock';
import api, { ApiError } from './services/api';

import { Header } from './components/layout/Header';
import { SummaryCards } from './components/dashboard/SummaryCards';
import { DecisionSummary } from './components/dashboard/DecisionSummary';
import { EventSimulator } from './components/events/EventSimulator';
import { PayablesTable } from './components/payables/PayablesTable';
import { ReceivablesTable } from './components/receivables/ReceivablesTable';
import { FinancingSummary } from './components/financing/FinancingSummary';
import { HistoryPanel } from './components/history/HistoryPanel';
import { CounterfactualInspector } from './components/counterfactual/CounterfactualInspector';
import { DashboardSkeleton } from './components/common/LoadingSkeleton';
import { ErrorBanner } from './components/common/ErrorBanner';

export const App: React.FC = () => {
  const [businessState, setBusinessState] = useState<BusinessState>(baselineBusinessState);
  const [decisionPlan, setDecisionPlan] = useState<DecisionPlan>(baselineDecisionPlan);
  const [previousCost, setPreviousCost] = useState<number | undefined>(undefined);
  const [isShockActive, setIsShockActive] = useState<boolean>(false);
  const [mode, setMode] = useState<'demo' | 'live'>('demo');
  
  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [isCounterfactualLoading, setIsCounterfactualLoading] = useState<boolean>(false);
  
  // History state
  const [history, setHistory] = useState<HistoryEntry[]>(mockHistoryEntries);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  
  // Counterfactual state
  const [counterfactualData, setCounterfactualData] = useState<CounterfactualResponse | null>(null);
  
  // Error state
  const [apiError, setApiError] = useState<string | null>(null);

  // Initialize data - attempt live backend first, fallback cleanly to mock
  const loadInitialData = useCallback(async () => {
    setIsInitialLoading(true);
    setApiError(null);
    try {
      const [remoteState, remoteDecisions] = await Promise.all([
        api.getState(),
        api.getDecisions(),
      ]);

      if (remoteState && remoteDecisions) {
        setBusinessState(remoteState);
        const total = remoteDecisions.reduce((acc, d) => acc + (d.cost || 0), 0);
        setDecisionPlan({
          decisions: remoteDecisions,
          total_cost: total,
        });
        setMode('live');
        
        // Fetch history if available
        try {
          const remoteHistory = await api.getHistory();
          if (Array.isArray(remoteHistory)) {
            setHistory(remoteHistory);
          }
        } catch {
          // History endpoint optional/graceful fallback
        }
      }
    } catch {
      // Backend unavailable - use canonical mock baseline
      setBusinessState(baselineBusinessState);
      setDecisionPlan(baselineDecisionPlan);
      setHistory(mockHistoryEntries);
      setMode('demo');
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle Event: AR-Y Receivable Delay
  const handleSimulateShock = async () => {
    setIsLoading(true);
    setPreviousCost(decisionPlan.total_cost);
    setApiError(null);

    if (mode === 'live') {
      try {
        const response = await api.postEvent({
          type: 'RECEIVABLE_DELAY',
          receivable_id: 'AR-Y',
          new_expected_day: 20,
        });

        if (response.new_plan) {
          setDecisionPlan(response.new_plan);
        }
        if (response.updated_state) {
          setBusinessState(response.updated_state);
        } else {
          setBusinessState(prev => ({
            ...prev,
            receivables: prev.receivables.map(r => 
              r.id === 'AR-Y' ? { ...r, expected_day: 20, late_day: 20 } : r
            )
          }));
        }

        // Refresh history
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
        const msg = err instanceof ApiError ? err.message : 'Event simulation request failed on backend';
        setApiError(msg);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Demo Mode deterministic transition
      setTimeout(() => {
        setBusinessState(shockBusinessState);
        setDecisionPlan(shockDecisionPlan);
        setIsShockActive(true);
        setIsLoading(false);
      }, 300);
    }
  };

  // Handle Reset to Baseline
  const handleReset = async () => {
    setIsLoading(true);
    setPreviousCost(undefined);
    setApiError(null);

    if (mode === 'live') {
      try {
        await api.postOptimize();
        await loadInitialData();
        setIsShockActive(false);
      } catch (err: unknown) {
        const msg = err instanceof ApiError ? err.message : 'Reset optimization request failed on backend';
        setApiError(msg);
      } finally {
        setIsLoading(false);
      }
    } else {
      setTimeout(() => {
        setBusinessState(baselineBusinessState);
        setDecisionPlan(baselineDecisionPlan);
        setIsShockActive(false);
        setIsLoading(false);
      }, 250);
    }
  };

  // Refresh History
  const handleRefreshHistory = async () => {
    if (mode === 'live') {
      setIsHistoryLoading(true);
      try {
        const remoteHistory = await api.getHistory();
        if (Array.isArray(remoteHistory)) {
          setHistory(remoteHistory);
        }
      } catch (err: unknown) {
        const msg = err instanceof ApiError ? err.message : 'Failed to fetch history';
        setApiError(msg);
      } finally {
        setIsHistoryLoading(false);
      }
    } else {
      setIsHistoryLoading(true);
      setTimeout(() => {
        setHistory(isShockActive ? mockHistoryEntries : [mockHistoryEntries[0]]);
        setIsHistoryLoading(false);
      }, 200);
    }
  };

  // Inspect Counterfactual Parameter Sweep
  const handleInspectCounterfactual = async (invoiceId: string) => {
    setIsCounterfactualLoading(true);
    setCounterfactualData(null);

    if (mode === 'live') {
      try {
        const data = await api.getCounterfactual(invoiceId);
        setCounterfactualData(data);
      } catch (err: unknown) {
        const msg = err instanceof ApiError ? err.message : `Failed to fetch counterfactual sweep for ${invoiceId}`;
        setApiError(msg);
        // Fallback to mock sweep data if available
        if (mockCounterfactuals[invoiceId]) {
          setCounterfactualData(mockCounterfactuals[invoiceId]);
        }
      } finally {
        setIsCounterfactualLoading(false);
      }
    } else {
      // Demo Mode deterministic mock counterfactual sweep
      setTimeout(() => {
        const mockData = mockCounterfactuals[invoiceId] || {
          invoice_id: invoiceId,
          parameter_name: 'Interest / Discount Rate',
          points: [
            { parameter_value: 0.05, optimal_action: 'PAY_NOW', cost: 1000, feasible: true },
            { parameter_value: 0.10, optimal_action: 'BANK_FINANCE', cost: 2000, feasible: true }
          ]
        };
        setCounterfactualData(mockData);
        setIsCounterfactualLoading(false);
      }, 250);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <Header 
        mode={mode} 
        isOptimizerReady={true} 
        onRefreshLive={loadInitialData}
        isRefreshing={isLoading || isInitialLoading}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 flex-1 space-y-6">
        {/* Error Notice */}
        {apiError && (
          <ErrorBanner message={apiError} onRetry={loadInitialData} />
        )}

        {isInitialLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Section 2: Summary Cards */}
            <SummaryCards businessState={businessState} />

            {/* Section 6: Optimal Joint Decision Plan */}
            <DecisionSummary 
              plan={decisionPlan} 
              previousCost={previousCost} 
            />

            {/* Section 7: Event Simulator Controls */}
            <EventSimulator
              onSimulateShock={handleSimulateShock}
              onReset={handleReset}
              isShockActive={isShockActive}
              isLoading={isLoading}
            />

            {/* Section 3: Payables Table */}
            <PayablesTable
              payables={businessState.payables}
              decisions={decisionPlan.decisions}
              onInspectCounterfactual={handleInspectCounterfactual}
            />

            {/* Section 4: Receivables Table */}
            <ReceivablesTable
              receivables={businessState.receivables}
              shockActive={isShockActive}
            />

            {/* Section 5: Financing & Obligations */}
            <FinancingSummary
              financing={businessState.financing}
              obligations={businessState.obligations}
            />

            {/* Section 11: History Section */}
            <HistoryPanel
              history={history}
              isOpen={isHistoryOpen}
              onToggle={() => setIsHistoryOpen(!isHistoryOpen)}
              onRefresh={handleRefreshHistory}
              isLoading={isHistoryLoading}
            />
          </>
        )}
      </main>

      {/* Counterfactual Parameter Sweep Modal */}
      <CounterfactualInspector
        data={counterfactualData}
        isLoading={isCounterfactualLoading}
        onClose={() => setCounterfactualData(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/40 px-4 sm:px-8 py-4 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">TREVO Core</span>
            <span>•</span>
            <span>CSI Origin 2026</span>
            <span>•</span>
            <span className="text-slate-400">Orion Components Pvt Ltd</span>
          </div>
          <div className="font-mono text-slate-400 text-[11px]">
            Branch: <span className="text-blue-400">feat/frontend-core</span> (Arnesh)
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
