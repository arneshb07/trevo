import React, { useState, useEffect, useCallback } from 'react';
import { BusinessState, DecisionPlan } from './types';
import { 
  baselineBusinessState, 
  baselineDecisionPlan, 
  shockBusinessState, 
  shockDecisionPlan 
} from './mock';
import api from './services/api';

import { Header } from './components/layout/Header';
import { SummaryCards } from './components/dashboard/SummaryCards';
import { DecisionSummary } from './components/dashboard/DecisionSummary';
import { EventSimulator } from './components/events/EventSimulator';
import { PayablesTable } from './components/payables/PayablesTable';
import { ReceivablesTable } from './components/receivables/ReceivablesTable';
import { FinancingSummary } from './components/financing/FinancingSummary';
import { DashboardSkeleton } from './components/common/LoadingSkeleton';
import { ErrorBanner } from './components/common/ErrorBanner';

export const App: React.FC = () => {
  const [businessState, setBusinessState] = useState<BusinessState>(baselineBusinessState);
  const [decisionPlan, setDecisionPlan] = useState<DecisionPlan>(baselineDecisionPlan);
  const [previousCost, setPreviousCost] = useState<number | undefined>(undefined);
  const [isShockActive, setIsShockActive] = useState<boolean>(false);
  const [mode, setMode] = useState<'demo' | 'live'>('demo');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Initialize data - attempt live backend first, fallback cleanly to mock
  const loadInitialData = useCallback(async () => {
    setIsInitialLoading(true);
    setApiError(null);
    try {
      // Try to fetch from backend if endpoint responds
      const [remoteState, remoteDecisions] = await Promise.all([
        api.getState(),
        api.getDecisions(),
      ]);

      setBusinessState(remoteState);
      const total = remoteDecisions.reduce((acc, d) => acc + (d.cost || 0), 0);
      setDecisionPlan({
        decisions: remoteDecisions,
        total_cost: total,
      });
      setMode('live');
    } catch {
      // Backend unavailable or not running - use canonical mock baseline
      setBusinessState(baselineBusinessState);
      setDecisionPlan(baselineDecisionPlan);
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
          // Update local state if backend didn't return full state
          setBusinessState(prev => ({
            ...prev,
            receivables: prev.receivables.map(r => 
              r.id === 'AR-Y' ? { ...r, expected_day: 20, late_day: 20 } : r
            )
          }));
        }
        setIsShockActive(true);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Event API call failed';
        setApiError(msg);
        // Fallback to mock shock
        setBusinessState(shockBusinessState);
        setDecisionPlan(shockDecisionPlan);
        setIsShockActive(true);
        setMode('demo');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Demo / Mock mode transition with realistic async feedback
      setTimeout(() => {
        setBusinessState(shockBusinessState);
        setDecisionPlan(shockDecisionPlan);
        setIsShockActive(true);
        setIsLoading(false);
      }, 350);
    }
  };

  // Handle Reset to Baseline
  const handleReset = async () => {
    setIsLoading(true);
    setPreviousCost(undefined);

    if (mode === 'live') {
      try {
        await api.postOptimize();
        await loadInitialData();
        setIsShockActive(false);
      } catch {
        // Fallback to baseline mock
        setBusinessState(baselineBusinessState);
        setDecisionPlan(baselineDecisionPlan);
        setIsShockActive(false);
        setMode('demo');
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

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <Header mode={mode} isOptimizerReady={true} />

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 flex-1 space-y-6">
        {/* Error / Offline Notice */}
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
          </>
        )}
      </main>

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
