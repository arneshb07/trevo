import { useState, useEffect, useCallback } from 'react';
import {
  NavigationTab,
  BusinessState,
  DecisionPlan,
  HistoryEntry,
  DecisionEngineResponse,
  CounterfactualResponse,
} from './types';
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
  // Canonical State from Backend API
  const [businessState, setBusinessState] = useState<BusinessState | null>(null);
  const [engineResponse, setEngineResponse] = useState<DecisionEngineResponse | null>(null);
  const [decisionPlan, setDecisionPlan] = useState<DecisionPlan | null>(null);
  const [comparisonPlan, setComparisonPlan] = useState<DecisionPlan | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  // Connection & Loading States
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  // Interaction States
  const [hasDecisionChange, setHasDecisionChange] = useState<boolean>(false);
  const [isSimulationLoading, setIsSimulationLoading] = useState<boolean>(false);
  const [simulationError, setSimulationError] = useState<string | undefined>(undefined);
  const [isVoiceLoading, setIsVoiceLoading] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string | undefined>(undefined);
  const [voiceText, setVoiceText] = useState<string | undefined>(undefined);
  const [voiceExplanation, setVoiceExplanation] = useState<string | undefined>(undefined);
  const [counterfactualData, setCounterfactualData] = useState<CounterfactualResponse | null>(null);
  const [isCounterfactualLoading, setIsCounterfactualLoading] = useState<boolean>(false);
  const [counterfactualError, setCounterfactualError] = useState<string | undefined>(undefined);

  // UI Navigation Tab State
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');

  // Load initial backend data from FastAPI
  const loadInitialData = useCallback(async () => {
    setInitialLoading(true);
    setConnectionStatus('connecting');
    setInitialError(null);

    try {
      const state = await api.getState();
      const decisions = await api.getDecisions();

      if (state && decisions && decisions.invoices) {
        const normalizedState = normalizeBusinessState(state);
        const parsedPlan = engineToDecisionPlan(decisions);

        setBusinessState(normalizedState);
        setEngineResponse(decisions);
        setDecisionPlan(parsedPlan);
        setComparisonPlan(parsedPlan);
        setHasDecisionChange(false);
        setConnectionStatus('connected');
        setInitialError(null);

        try {
          const remoteHistory = await api.getHistory();
          if (remoteHistory && Array.isArray(remoteHistory.history)) {
            setHistory(historyApiToEntries(remoteHistory));
          }
        } catch {
          // History endpoint error handling
        }
      } else {
        throw new Error('Invalid or incomplete data payload received from backend.');
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Failed to connect to backend';
      console.error('[TREVO API] Initial load failed:', msg);
      setConnectionStatus('disconnected');
      setInitialError(`Backend connection failed: ${msg}. Make sure the backend server is running.`);
      setBusinessState(null);
      setDecisionPlan(null);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle Event Simulation (Shock) -> Sends real POST /events to backend
  const handleRunSimulation = async (day: number, receivableId: string) => {
    setIsSimulationLoading(true);
    setSimulationError(undefined);

    try {
      const targetId = receivableId || (businessState?.receivables[0]?.id) || 'AR-Y';
      const response = await api.postEvent({
        type: 'RECEIVABLE_DELAY',
        invoice_id: targetId,
        new_day: day,
      });

      if (!response || !response.new_decisions) {
        throw new Error('Event simulation response did not include updated decision plan.');
      }

      setEngineResponse(response.new_decisions);
      setComparisonPlan(engineToDecisionPlan(response.previous_decisions));
      setDecisionPlan(engineToDecisionPlan(response.new_decisions));
      setHasDecisionChange(Boolean(response.changes && response.changes.length > 0));

      // Refresh real state from database
      const updatedState = await api.getState();
      setBusinessState(normalizeBusinessState(updatedState));

      // Refresh history from database
      try {
        const updatedHistory = await api.getHistory();
        if (updatedHistory && Array.isArray(updatedHistory.history)) {
          setHistory(historyApiToEntries(updatedHistory));
        }
      } catch {
        // Keep existing history if endpoint fails
      }

      setActiveTab('decisions');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Simulation failed';
      console.error('[TREVO API] Simulation failed:', msg);
      setSimulationError(`Simulation request failed: ${msg}`);
      setHasDecisionChange(false);
    } finally {
      setIsSimulationLoading(false);
    }
  };

  // Handle Reset to Baseline (POST /reset or re-seed)
  const handleResetToBaseline = async () => {
    setActiveTab('overview');
    try {
      await api.reset();
    } catch {
      // Fallback
    }
    await loadInitialData();
  };

  // Handle Voice / Text Explanation
  const handleExplainVoice = async () => {
    setIsVoiceLoading(true);
    setVoiceError(undefined);
    try {
      const targetInvoiceId = decisionPlan?.decisions.find(
        (d) => comparisonPlan?.decisions.find((cp) => cp.invoice_id === d.invoice_id)?.selected_action !== d.selected_action
      )?.invoice_id || 'INV-B';
      const response = await api.explainVoice(targetInvoiceId);
      setVoiceExplanation(response.text);
      if (response.audio) {
        setVoiceText(response.audio);
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Voice briefing unavailable.';
      setVoiceError(msg);
    } finally {
      setIsVoiceLoading(false);
    }
  };

  // Handle Counterfactual Parameter Sweep
  const handleLoadCounterfactual = async () => {
    setIsCounterfactualLoading(true);
    setCounterfactualError(undefined);
    try {
      const targetInvoiceId = decisionPlan?.decisions.find(
        (d) => comparisonPlan?.decisions.find((cp) => cp.invoice_id === d.invoice_id)?.selected_action !== d.selected_action
      )?.invoice_id || 'INV-B';
      const data = await api.getCounterfactual(targetInvoiceId);
      setCounterfactualData(data);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Counterfactual sweep failed.';
      setCounterfactualData(null);
      setCounterfactualError(msg);
    } finally {
      setIsCounterfactualLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Header with Clickable Logo (Immediate Baseline Reset) and Connection Status */}
      <Header
        onResetToBaseline={handleResetToBaseline}
        showTitleGroup={activeTab === 'overview'}
        title="Working Capital"
        subtitle="Real-time overview of deployed capital and liquidity."
        connectionStatus={connectionStatus}
      />

      {/* Main Content Area */}
      <main>
        {initialLoading ? (
          <div className="liquid-card content-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="badge badge-safe" style={{ marginBottom: '16px' }}>
              <span className="badge-dot" /> Connecting to TREVO Engine...
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              Loading portfolio state and CP-SAT optimizer decisions.
            </p>
          </div>
        ) : initialError || !businessState || !decisionPlan ? (
          <div className="liquid-card content-card" style={{ textAlign: 'center', padding: '50px 20px', border: '1px solid var(--color-warning-border)' }}>
            <div className="badge badge-warning" style={{ marginBottom: '16px' }}>
              <span className="badge-dot" /> Backend Unavailable
            </div>
            <h3 style={{ color: 'var(--color-text-title)', marginBottom: '8px', fontSize: '1.2rem' }}>
              Unable to reach TREVO Backend Server
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', maxWidth: '520px', margin: '0 auto 20px' }}>
              {initialError || 'Please ensure the FastAPI backend is running on http://localhost:8000.'}
            </p>
            <button type="button" className="btn-primary" onClick={loadInitialData}>
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewScreen
                metrics={getSummaryMetricsViewModel(businessState, decisionPlan, engineResponse || undefined)}
                invoices={getInvoiceViewModels(businessState, decisionPlan)}
                businessState={businessState}
                onRunSimulation={handleRunSimulation}
                isSimulationLoading={isSimulationLoading}
                simulationError={simulationError}
              />
            )}

            {activeTab === 'decisions' && (
              <DecisionsScreen
                decisionData={{
                  ...getDecisionUpdateViewModel(
                    comparisonPlan || decisionPlan,
                    decisionPlan,
                    businessState
                  ),
                  forecastMilestones: engineResponse ? engineToForecastMilestones(engineResponse) : [],
                  liquidityBuffer: engineResponse?.summary.buffer || businessState.buffer,
                }}
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
                historyItems={getHistoryViewModels(history)}
                onSelectHistoryItem={() => setActiveTab('decisions')}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Bottom Navigation Pill */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;
