import { 
  BusinessState, 
  Decision, 
  FinancialEvent, 
  EventResponse, 
  HistoryItem, 
  CounterfactualPoint 
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(`API Error ${response.status}: ${response.statusText} ${errorBody}`);
      }

      return await response.json();
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Network/API request failed for ${endpoint}: ${err.message}`);
      }
      throw new Error(`Unknown network error occurred for ${endpoint}`);
    }
  }

  /**
   * Fetch current BusinessState from backend
   */
  async getState(): Promise<BusinessState> {
    return this.request<BusinessState>('/state');
  }

  /**
   * Fetch current optimizer decisions
   */
  async getDecisions(): Promise<Decision[]> {
    return this.request<Decision[]>('/decisions');
  }

  /**
   * Post a financial shock / event to trigger re-optimization
   */
  async postEvent(event: FinancialEvent): Promise<EventResponse> {
    return this.request<EventResponse>('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  /**
   * Force re-optimization of the current state
   */
  async postOptimize(): Promise<Decision[]> {
    return this.request<Decision[]>('/optimize', {
      method: 'POST',
    });
  }

  /**
   * Fetch decision & event history
   */
  async getHistory(): Promise<HistoryItem[]> {
    return this.request<HistoryItem[]>('/history');
  }

  /**
   * Counterfactual parameter sweep for a given decision/invoice ID
   */
  async getCounterfactual(id: string): Promise<CounterfactualPoint[]> {
    return this.request<CounterfactualPoint[]>(`/decision/${id}/counterfactual`);
  }
}

export const api = new ApiService();
export default api;
