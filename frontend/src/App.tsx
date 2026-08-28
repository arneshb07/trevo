import { useState } from 'react';
import { NavigationTab, DecisionUpdateData } from './types';
import {
  baselineSummaryMetrics,
  baselineInvoices,
  simulatedDecisionData,
  sampleHistoryList,
} from './mock/data';
import { Header } from './components/common/Header';
import { BottomNav } from './components/navigation/BottomNav';
import { OverviewScreen } from './components/screens/OverviewScreen';
import { DecisionsScreen } from './components/screens/DecisionsScreen';
import { HistoryScreen } from './components/screens/HistoryScreen';

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [decisionData, setDecisionData] = useState<DecisionUpdateData>(simulatedDecisionData);

  // Return to baseline Overview action
  const handleResetToBaseline = () => {
    setActiveTab('overview');
    setDecisionData(simulatedDecisionData);
  };

  // Run simulation handler: triggers transition to Decision view
  const handleRunSimulation = (day: number) => {
    // Dynamically update decision text if day varies
    const updated = {
      ...simulatedDecisionData,
      subtitle: `Customer Beta's payment was delayed from Day 9 to Day ${day || 20}. To prevent a breach of your ₹5,00,000 buffer on Day 12, TREVO has automatically updated your strategy.`,
    };
    setDecisionData(updated);
    setActiveTab('decisions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      {/* Top Header with Clickable Logo (resets to Overview) */}
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
            metrics={baselineSummaryMetrics}
            invoices={baselineInvoices}
            onRunSimulation={handleRunSimulation}
          />
        )}

        {activeTab === 'decisions' && (
          <DecisionsScreen
            decisionData={decisionData}
            onBackToOverview={() => setActiveTab('overview')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryScreen
            historyItems={sampleHistoryList}
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
