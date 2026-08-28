import React, { useState, useEffect, useCallback } from 'react';
import { 
  BusinessState, 
  DecisionPlan, 
  Decision, 
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

import { TrevoHeader } from './components/layout/TrevoHeader';
import { BottomNav, NavTab } from './components/layout/BottomNav';
import { OverviewPage } from './pages/OverviewPage';
import { DecisionsPage } from './pages/DecisionsPage';
import { DecisionDetailPage } from './pages/DecisionDetailPage';
import { HistoryPage } from './pages/HistoryPage';
import { DashboardSkeleton } from './components/common/LoadingSkeleton';
import { ErrorBanner } from './components/common/ErrorBanner';

export const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('OVERVIEW');
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);

  // Business & Decision State
  const [businessState, setBusinessState] = useState<BusinessState>(baselineBusinessState);
  const [decisionPlan, setDecisionPlan] = useState<DecisionPlan>(baselineDecisionPlan);
  const [isShockActive, setIsShockActive] = useState<boolean>(false);
  const [hasUnviewedDecision, setHasUnviewedDecision] = useState<boolean>(false);
  
  // History State
  const [history, setHistory] = useState<HistoryEntry[]>(mockHistoryEntries);
  
  // Counterfactual State
  const [counterfactualData, setCounterfactualData] = useState<CounterfactualResponse | null>(null);

  // App & Connection State
  const [mode, setMode] = useState<'demo' | 'live'>('demo');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isVoiceLoading, setIsVoiceLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Initial load: Attempt backend connection, fallback gracefully to mock baseline
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

        try {
          const remoteHistory = await api.getHistory();
          if (Array.isArray(remoteHistory)) {
            setHistory(remoteHistory);
          }
        } catch {
          // Graceful fallback
        }
      }
    } catch {
      // Offline fallback: Use gold baseline
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

  // Primary Event: Simulate Receivable Delay (AR-Y to Day 20)
  const handleSimulateEvent = async (delayDay: number = 20) => {
    setIsLoading(true);
    setApiError(null);

    if (mode === 'live') {
      try {
        const response = await api.postEvent({
          type: 'RECEIVABLE_DELAY',
          receivable_id: 'AR-Y',
          new_expected_day: delayDay,
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
              r.id === 'AR-Y' || r.id === 'AR Y' ? { ...r, expected_day: delayDay, late_day: delayDay } : r
            )
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
        setHasUnviewedDecision(true);
        setActiveTab('DECISIONS');
      } catch (err: unknown) {
        const msg = err instanceof ApiError ? err.message : 'Event simulation failed on backend';
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
        setHasUnviewedDecision(true);
        setIsLoading(false);
        setActiveTab('DECISIONS');
      }, 350);
    }
  };

  // Reset to Baseline State
  const handleReset = async () => {
    setIsLoading(true);
    setApiError(null);

    if (mode === 'live') {
      try {
        await api.postOptimize();
        await loadInitialData();
        setIsShockActive(false);
        setHasUnviewedDecision(false);
      } catch (err: unknown) {
        const msg = err instanceof ApiError ? err.message : 'Reset failed on backend';
        setApiError(msg);
      } finally {
        setIsLoading(false);
      }
    } else {
      setTimeout(() => {
        setBusinessState(baselineBusinessState);
        setDecisionPlan(baselineDecisionPlan);
        setIsShockActive(false);
        setHasUnviewedDecision(false);
        setIsLoading(false);
      }, 250);
    }
  };

  // Select a Decision to inspect detail
  const handleSelectDecision = async (decision: Decision) => {
    setSelectedDecision(decision);
    setCounterfactualData(mockCounterfactuals[decision.invoice_id] || null);

    if (mode === 'live') {
      try {
        const sweepData = await api.getCounterfactual(decision.invoice_id);
        if (sweepData) {
          setCounterfactualData(sweepData);
        }
      } catch {
        // Fallback to mock counterfactual
      }
    }
  };

  // Optional Voice Briefing
  const handlePlayVoiceBriefing = async () => {
    if (isVoiceLoading) return;
    setIsVoiceLoading(true);
    try {
      // Speech synthesis fallback / optional backend voice endpoint
      if ('speechSynthesis' in window) {
        const text = isShockActive
          ? "Customer Beta's payment was delayed from Day 9 to Day 20. To prevent a breach of your 500,000 rupee safety buffer on Day 12, TREVO has automatically updated your strategy for Invoice B to Bank Financing."
          : "Portfolio strategy optimized. Invoice A uses bank financing for discount capture, Invoice B utilizes a 5-day delay, and Invoice C uses supplier financing.";
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // Non-blocking voice failure
    } finally {
      setIsVoiceLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6FAF7] text-[#0F2E22] flex flex-col justify-between">
      {/* Header */}
      <TrevoHeader
        mode={mode}
        onRefresh={loadInitialData}
        isRefreshing={isLoading || isInitialLoading}
        showNewStrategy={activeTab === 'HISTORY'}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full">
        {apiError && (
          <div className="max-w-6xl mx-auto px-6 mb-4">
            <ErrorBanner message={apiError} onRetry={loadInitialData} />
          </div>
        )}

        {isInitialLoading ? (
          <div className="max-w-6xl mx-auto px-6 pt-8">
            <DashboardSkeleton />
          </div>
        ) : selectedDecision ? (
          <DecisionDetailPage
            decision={selectedDecision}
            onBack={() => setSelectedDecision(null)}
            counterfactualData={counterfactualData}
            onPlayVoiceBriefing={handlePlayVoiceBriefing}
            isVoiceLoading={isVoiceLoading}
          />
        ) : activeTab === 'OVERVIEW' ? (
          <OverviewPage
            businessState={businessState}
            decisionPlan={decisionPlan}
            isShockActive={isShockActive}
            onSimulateEvent={handleSimulateEvent}
            onReset={handleReset}
            isLoading={isLoading}
            onSelectDecision={handleSelectDecision}
            onNavigateDecisions={() => setActiveTab('DECISIONS')}
          />
        ) : activeTab === 'DECISIONS' ? (
          <DecisionsPage
            businessState={businessState}
            decisionPlan={decisionPlan}
            isShockActive={isShockActive}
            onBackToOverview={() => setActiveTab('OVERVIEW')}
            onSelectDecision={handleSelectDecision}
          />
        ) : (
          <HistoryPage
            history={history}
            onRefresh={loadInitialData}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Floating Bottom Navigation Bar */}
      {!selectedDecision && (
        <BottomNav
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'DECISIONS') {
              setHasUnviewedDecision(false);
            }
          }}
          hasUnviewedDecision={hasUnviewedDecision}
        />
      )}
    </div>
  );
};

export default App;
