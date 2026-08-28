import { 
  BusinessState, 
  FinancialEvent, 
  CounterfactualResponse,
  ApiErrorResponse,
  VoiceExplanationResponse,
  DecisionEngineResponse,
  EventEngineResponse,
  HistoryApiResponse
} from '../types';

export class ApiError extends Error {
  statusCode?: number;
  endpoint: string;
  detail?: string;

  constructor(message: string, endpoint: string, statusCode?: number, detail?: string) {
    super(message);
    this.name = 'ApiError';
    this.endpoint = endpoint;
    this.statusCode = statusCode;
    this.detail = detail;
  }
}

const DEFAULT_TIMEOUT_MS = 10000;

class ApiService {
  private getBaseUrl(): string {
    const rawUrl = import.meta.env.VITE_API_BASE_URL;
    if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim()) {
      return rawUrl.trim().replace(/\/+$/, '');
    }
    return 'http://localhost:8000';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${cleanEndpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    if (import.meta.env.DEV) {
      console.debug(`[TREVO API] REQUEST: ${options.method || 'GET'} ${url}`);
    }

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (import.meta.env.DEV) {
        console.debug(`[TREVO API] RESPONSE: ${response.status} ${url}`);
      }

      if (!response.ok) {
        let errorDetail = '';
        try {
          const errJson: ApiErrorResponse = await response.json();
          errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
        } catch {
          errorDetail = await response.text().catch(() => '');
        }
        throw new ApiError(
          `Request to ${cleanEndpoint} failed (${response.status} ${response.statusText})${errorDetail ? `: ${errorDetail}` : ''}`,
          cleanEndpoint,
          response.status,
          errorDetail
        );
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof ApiError) {
        throw err;
      }
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          throw new ApiError(`Request to ${cleanEndpoint} timed out after ${DEFAULT_TIMEOUT_MS / 1000}s`, cleanEndpoint, 408);
        }
        throw new ApiError(`Network connection error for ${cleanEndpoint}: ${err.message}`, cleanEndpoint);
      }
      throw new ApiError(`Unknown network error occurred for ${cleanEndpoint}`, cleanEndpoint);
    }
  }

  /**
   * Fetch current BusinessState from backend (GET /state)
   */
  async getState(): Promise<BusinessState> {
    return this.request<BusinessState>('/state');
  }

  /**
   * Fetch current optimizer decisions (GET /decisions)
   */
  async getDecisions(): Promise<DecisionEngineResponse> {
    return this.request<DecisionEngineResponse>('/decisions');
  }

  /**
   * Post a financial shock / event to trigger re-optimization (POST /events)
   */
  async postEvent(event: FinancialEvent): Promise<EventEngineResponse> {
    return this.request<EventEngineResponse>('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  /**
   * Force re-optimization of the current state (POST /optimize)
   */
  async postOptimize(): Promise<DecisionEngineResponse> {
    return this.request<DecisionEngineResponse>('/optimize', {
      method: 'POST',
    });
  }

  /**
   * Reset database state to baseline (POST /reset)
   */
  async reset(): Promise<{ status: string; message: string; state: BusinessState; decisions: DecisionEngineResponse }> {
    return this.request<{ status: string; message: string; state: BusinessState; decisions: DecisionEngineResponse }>('/reset', {
      method: 'POST',
    });
  }

  /**
   * Fetch decision & event history (GET /history)
   */
  async getHistory(): Promise<HistoryApiResponse> {
    return this.request<HistoryApiResponse>('/history');
  }

  /**
   * Counterfactual parameter sweep for a given decision/invoice ID (GET /decision/:id/counterfactual)
   */
  async getCounterfactual(id: string): Promise<CounterfactualResponse> {
    return this.request<CounterfactualResponse>(`/decision/${id}/counterfactual`);
  }

  /**
   * Request narrated decision context from the backend (POST /explain/voice)
   */
  async explainVoice(invoiceId: string): Promise<VoiceExplanationResponse> {
    return this.request<VoiceExplanationResponse>('/explain/voice', {
      method: 'POST',
      body: JSON.stringify({ invoice_id: invoiceId }),
    });
  }
}

export const api = new ApiService();
export default api;
