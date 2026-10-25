import {
  HealthStatus,
  TelemetryStats,
  DetectionResult,
  CSVUploadResponse,
  DetectionEvent,
  FlowRecord,
  NetworkGraphData,
  AttackPath,
  AttackPathPredictionRequest,
  AttackPathPredictionResponse,
  PredictionHistoryItem,
  CriticalAssetItem,
  EngineHealthResponse,
  DefenseSimulationResult,
  DefenseSimulationRequest,
  DefenseSimulationResponse,
  DefenseRecommendationRequest,
  DefenseRecommendationResponse,
  DefenseApprovalRequest,
  DefenseApprovalResponse,
  DefenseHistoryItem,
  DefenseEngineHealth,
  IncidentRecord,
  DetectionModelsResponse,
  DetectionMetricsResponse,
  StructuredThreatAlert,
  DetectionHistoryResponse,
  NetworkAlert,
  UnmatchedEvent,
  ScenarioLoadResponse,
  NetworkNode,
  NetworkEdge,
} from '../types';

/**
 * Resolves the appropriate backend API Base URL based on environment.
 * Prevents using localhost in cloud/production environments.
 */
export function resolveApiBaseUrl(): string {
  // 1. Check runtime localStorage override (allows dynamic re-targeting if desired)
  if (typeof window !== 'undefined') {
    try {
      const override = localStorage.getItem('omen_api_base_url') || localStorage.getItem('nox_api_base_url');
      if (override && override.trim()) {
        return sanitizeUrl(override.trim());
      }
    } catch {
      // LocalStorage access restricted in some iframes
    }
  }

  // 2. Read Vite environment variable
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  const isDev = import.meta.env.DEV;
  const isLocalClient =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const isCloudHost = typeof window !== 'undefined' && !isLocalClient;

  if (envUrl) {
    const cleaned = sanitizeUrl(envUrl);
    const isEnvLocal = cleaned.includes('localhost') || cleaned.includes('127.0.0.1');

    // Security guard: If deploying to production (e.g. Vercel), do NOT use localhost!
    if ((isCloudHost || !isDev) && isEnvLocal) {
      console.warn(
        `[ØMEN Configuration Notice] VITE_API_BASE_URL points to "${cleaned}", which is unreachable in a production cloud environment. Falling back to live hosted backend: https://nox-neural-backend.onrender.com`
      );
      return 'https://nox-neural-backend.onrender.com';
    }
    return cleaned;
  }

  // 3. Fallbacks when VITE_API_BASE_URL is not set:
  // If running on a cloud hostname (e.g. *.vercel.app), NEVER default to localhost!
  if (isCloudHost) {
    return 'https://nox-neural-backend.onrender.com';
  }

  if (isDev || isLocalClient) {
    return 'http://127.0.0.1:8000';
  }

  // Production fallback — never use localhost in production
  return 'https://nox-neural-backend.onrender.com';
}

function sanitizeUrl(url: string): string {
  let cleaned = url.replace(/['"]+/g, '').trim().replace(/\/+$/, '');
  // Auto-strip trailing /api or /api/ since endpoint paths already include /api/
  if (cleaned.endsWith('/api')) {
    cleaned = cleaned.slice(0, -4);
  }
  // Auto-upgrade http:// to https:// when loaded over HTTPS to prevent Mixed Content security blocks
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    cleaned.startsWith('http://') &&
    !cleaned.includes('localhost') &&
    !cleaned.includes('127.0.0.1')
  ) {
    cleaned = cleaned.replace(/^http:\/\//, 'https://');
  }
  return cleaned;
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export class ApiService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ? sanitizeUrl(baseUrl) : resolveApiBaseUrl();
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = sanitizeUrl(url);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('omen_api_base_url', this.baseUrl);
        localStorage.setItem('nox_api_base_url', this.baseUrl);
      } catch {
        // Ignored
      }
    }
  }

  resetBaseUrl(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('omen_api_base_url');
        localStorage.removeItem('nox_api_base_url');
      } catch {
        // Ignored
      }
    }
    this.baseUrl = resolveApiBaseUrl();
  }

  isLocalhost(): boolean {
    return this.baseUrl.includes('127.0.0.1') || this.baseUrl.includes('localhost');
  }

  private async request<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const timeoutMs = options?.timeoutMs ?? (endpoint.includes('/upload') ? 60000 : 20000);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const fetchOptions: RequestInit = {
        ...options,
        signal: options?.signal || controller.signal,
      };

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `Server responded with HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // Response body was not JSON
        }
        throw new Error(errorMessage);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      throw this.categorizeError(err, url, timeoutMs);
    }
  }

  private categorizeError(err: any, url: string, timeoutMs: number): Error {
    // 1. Timeout / Abort
    if (err.name === 'AbortError') {
      return new Error(
        `Connection timed out (${timeoutMs / 1000}s) waiting for ${url}. If using Render Free Tier, the backend container may be spinning up from sleep (~60-90s). Please wait and retry.`
      );
    }

    // 2. Client is completely offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return new Error('Your browser is offline. Please check your internet connectivity.');
    }

    // 3. Mixed Content block
    const isClientHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    if (isClientHttps && url.startsWith('http://') && !url.includes('localhost')) {
      return new Error(
        `Mixed Content Blocked: HTTPS frontend cannot query insecure HTTP backend at "${url}". Configure VITE_API_BASE_URL to an HTTPS endpoint.`
      );
    }

    // 4. Production app pointing to localhost
    if (
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1' &&
      (url.includes('localhost') || url.includes('127.0.0.1'))
    ) {
      return new Error(
        `Localhost Inaccessible: Cloud deployment cannot communicate with client localhost (${url}). Ensure VITE_API_BASE_URL points to your live Render backend in Vercel settings.`
      );
    }

    // 5. Network / CORS failure
    const msg = (err.message || '').toLowerCase();
    if (
      err.name === 'TypeError' ||
      msg.includes('failed to fetch') ||
      msg.includes('network') ||
      msg.includes('load failed')
    ) {
      return new Error(
        `NØX backend at ${url} is unreachable. The service may be cold-starting on Render (~60–90s) or CORS origin policy may need verification.`
      );
    }

    return err instanceof Error ? err : new Error(String(err));
  }

  /**
   * Health and model readiness query.
   * Probes /api/health with automatic fallback to /health.
   */
  async getHealth(timeoutMs: number = 12000): Promise<HealthStatus> {
    try {
      return await this.request<HealthStatus>('/api/health', { timeoutMs });
    } catch (primaryErr) {
      try {
        return await this.request<HealthStatus>('/health', { timeoutMs });
      } catch {
        throw primaryErr;
      }
    }
  }

  async getStats(timeoutMs: number = 20000): Promise<TelemetryStats> {
    return this.request<TelemetryStats>('/api/stats', { timeoutMs });
  }

  async getHistory(
    limit: number = 50,
    offset: number = 0,
    sourceType?: string,
    timeoutMs: number = 20000
  ): Promise<DetectionEvent[]> {
    let query = `/api/history?limit=${limit}&offset=${offset}`;
    if (sourceType) {
      query += `&source_type=${encodeURIComponent(sourceType)}`;
    }
    return this.request<DetectionEvent[]>(query, { timeoutMs });
  }

  async detectSingle(record: FlowRecord, timeoutMs: number = 25000): Promise<DetectionResult> {
    return this.request<DetectionResult>('/api/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
      timeoutMs,
    });
  }

  async detectBatch(records: FlowRecord[], timeoutMs: number = 35000): Promise<DetectionResult[]> {
    return this.request<DetectionResult[]>('/api/detect/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records }),
      timeoutMs,
    });
  }

  async uploadCSV(file: File, timeoutMs: number = 60000): Promise<CSVUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<CSVUploadResponse>('/api/detect/upload', {
      method: 'POST',
      body: formData,
      timeoutMs,
    });
  }

  // --- ØMEN Specific API Endpoints ---
  async getNetworkTopology(isolatedNodes?: string[], timeoutMs: number = 20000): Promise<NetworkGraphData> {
    const query = isolatedNodes && isolatedNodes.length > 0
      ? `/api/v1/network/graph?isolated_nodes=${encodeURIComponent(isolatedNodes.join(','))}`
      : '/api/v1/network/graph';
    return this.request<NetworkGraphData>(query, { timeoutMs });
  }

  async getNetworkAssets(
    params?: { zone?: string; criticality?: string; security_status?: string; search?: string },
    timeoutMs: number = 20000
  ): Promise<{ count: number; total_assets: number; assets: NetworkNode[] }> {
    let query = '/api/v1/network/assets';
    const queryParts: string[] = [];
    if (params?.zone && params.zone !== 'ALL') queryParts.push(`zone=${encodeURIComponent(params.zone)}`);
    if (params?.criticality && params.criticality !== 'ALL') queryParts.push(`criticality=${encodeURIComponent(params.criticality)}`);
    if (params?.security_status && params.security_status !== 'ALL') queryParts.push(`security_status=${encodeURIComponent(params.security_status)}`);
    if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    if (queryParts.length > 0) query += `?${queryParts.join('&')}`;
    return this.request(query, { timeoutMs });
  }

  async getNetworkAsset(assetId: string, timeoutMs: number = 20000): Promise<NetworkNode> {
    return this.request<NetworkNode>(`/api/v1/network/assets/${encodeURIComponent(assetId)}`, { timeoutMs });
  }

  async getNetworkRelationships(timeoutMs: number = 20000): Promise<{ count: number; relationships: NetworkEdge[] }> {
    return this.request('/api/v1/network/relationships', { timeoutMs });
  }

  async getNetworkAlerts(
    assetId?: string,
    severity?: string,
    limit: number = 50,
    timeoutMs: number = 20000
  ): Promise<{ count: number; alerts: NetworkAlert[] }> {
    let query = `/api/v1/network/alerts?limit=${limit}`;
    if (assetId) query += `&asset_id=${encodeURIComponent(assetId)}`;
    if (severity && severity !== 'ALL') query += `&severity=${encodeURIComponent(severity)}`;
    return this.request(query, { timeoutMs });
  }

  async getUnmatchedEvents(limit: number = 50, timeoutMs: number = 20000): Promise<{ count: number; unmatched_events: UnmatchedEvent[] }> {
    return this.request(`/api/v1/network/unmatched-events?limit=${limit}`, { timeoutMs });
  }

  async loadSimulationScenario(scenarioType: string, timeoutMs: number = 25000): Promise<ScenarioLoadResponse> {
    return this.request<ScenarioLoadResponse>('/api/v1/network/simulations/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_type: scenarioType }),
      timeoutMs,
    });
  }

  async predictAttackPaths(
    sourceNode: string = 'srv-web-01',
    targetNode?: string,
    isolatedNodes: string[] = [],
    maxHops: number = 5,
    timeoutMs: number = 20000
  ): Promise<{
    source_node: string;
    total_paths_discovered: number;
    paths: AttackPath[];
    critical_chokepoints: Array<{ node_id: string; name: string; frequency: number; criticality: string }>;
  }> {
    return this.request('/api/v1/prediction/attack-paths', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_node: sourceNode,
        target_node: targetNode,
        isolated_nodes: isolatedNodes,
        max_hops: maxHops,
      }),
      timeoutMs,
    });
  }

  async predictAttackPathsV2(
    requestData: AttackPathPredictionRequest,
    timeoutMs: number = 20000
  ): Promise<AttackPathPredictionResponse> {
    return this.request<AttackPathPredictionResponse>('/api/v1/attack-paths/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
      timeoutMs,
    });
  }

  async getPredictionHistory(limit: number = 20, timeoutMs: number = 20000): Promise<PredictionHistoryItem[]> {
    return this.request<PredictionHistoryItem[]>(`/api/v1/attack-paths/history?limit=${limit}`, { timeoutMs });
  }

  async getCriticalAssets(timeoutMs: number = 20000): Promise<CriticalAssetItem[]> {
    return this.request<CriticalAssetItem[]>('/api/v1/attack-paths/critical-assets', { timeoutMs });
  }

  async getPredictionHealth(timeoutMs: number = 10000): Promise<EngineHealthResponse> {
    return this.request<EngineHealthResponse>('/api/v1/attack-paths/health', { timeoutMs });
  }

  async getPredictionById(predictionId: string, timeoutMs: number = 20000): Promise<any> {
    return this.request<any>(`/api/v1/attack-paths/${encodeURIComponent(predictionId)}`, { timeoutMs });
  }

  async simulateIsolation(
    isolatedNodeIds: string[],
    entryNode: string = 'srv-web-01',
    timeoutMs: number = 20000
  ): Promise<DefenseSimulationResult> {
    return this.request<DefenseSimulationResult>('/api/v1/defense/simulate-isolation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isolated_node_ids: isolatedNodeIds,
        entry_node: entryNode,
      }),
      timeoutMs,
    });
  }

  async getDefenseRecommendations(
    req: DefenseRecommendationRequest,
    timeoutMs: number = 20000
  ): Promise<DefenseRecommendationResponse> {
    return this.request<DefenseRecommendationResponse>('/api/v1/defense/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      timeoutMs,
    });
  }

  async runDefenseSimulation(
    req: DefenseSimulationRequest,
    timeoutMs: number = 20000
  ): Promise<DefenseSimulationResponse> {
    return this.request<DefenseSimulationResponse>('/api/v1/defense/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      timeoutMs,
    });
  }

  async submitDefenseApproval(
    req: DefenseApprovalRequest,
    timeoutMs: number = 20000
  ): Promise<DefenseApprovalResponse> {
    return this.request<DefenseApprovalResponse>('/api/v1/defense/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      timeoutMs,
    });
  }

  async getDefenseActions(timeoutMs: number = 10000): Promise<any[]> {
    return this.request<any[]>('/api/v1/defense/actions', { timeoutMs });
  }

  async getDefenseSimulations(limit: number = 20, timeoutMs: number = 20000): Promise<DefenseHistoryItem[]> {
    return this.request<DefenseHistoryItem[]>(`/api/v1/defense/simulations?limit=${limit}`, { timeoutMs });
  }

  async getDefenseSimulationById(simulationId: string, timeoutMs: number = 20000): Promise<any> {
    return this.request<any>(`/api/v1/defense/simulations/${encodeURIComponent(simulationId)}`, { timeoutMs });
  }

  async getDefenseHealth(timeoutMs: number = 10000): Promise<DefenseEngineHealth> {
    return this.request<DefenseEngineHealth>('/api/v1/defense/health', { timeoutMs });
  }

  async getIncidents(
    severity?: string,
    status?: string,
    limit: number = 50,
    offset: number = 0,
    timeoutMs: number = 20000
  ): Promise<{ total: number; offset: number; limit: number; incidents: IncidentRecord[] }> {
    let query = `/api/v1/incidents?limit=${limit}&offset=${offset}`;
    if (severity) query += `&severity=${encodeURIComponent(severity)}`;
    if (status) query += `&status=${encodeURIComponent(status)}`;
    return this.request(query, { timeoutMs });
  }

  async getIncidentById(incidentId: string, timeoutMs: number = 20000): Promise<IncidentRecord> {
    return this.request<IncidentRecord>(`/api/v1/incidents/${encodeURIComponent(incidentId)}`, { timeoutMs });
  }

  async getIncidentTimeline(incidentId: string, timeoutMs: number = 20000): Promise<{ incident_id: string; count: number; timeline: any[] }> {
    return this.request(`/api/v1/incidents/${encodeURIComponent(incidentId)}/timeline`, { timeoutMs });
  }

  async getIncidentRelationships(incidentId: string, timeoutMs: number = 20000): Promise<{ incident_id: string; count: number; relationships: any[] }> {
    return this.request(`/api/v1/incidents/${encodeURIComponent(incidentId)}/relationships`, { timeoutMs });
  }

  async getIncidentReport(incidentId: string, timeoutMs: number = 20000): Promise<any> {
    return this.request(`/api/v1/incidents/${encodeURIComponent(incidentId)}/report`, { timeoutMs });
  }

  async addIncidentNote(incidentId: string, payload: { author?: string; note: string }, timeoutMs: number = 20000): Promise<any> {
    return this.request(`/api/v1/incidents/${encodeURIComponent(incidentId)}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeoutMs,
    });
  }

  async getIncidentNotes(incidentId: string, timeoutMs: number = 20000): Promise<{ incident_id: string; count: number; notes: any[] }> {
    return this.request(`/api/v1/incidents/${encodeURIComponent(incidentId)}/notes`, { timeoutMs });
  }

  async exportIncidentsJson(timeoutMs: number = 20000): Promise<any> {
    return this.request('/api/v1/incidents/export/json', { timeoutMs });
  }

  async getAttackReplayTimeline(incidentId?: string, timeoutMs: number = 20000): Promise<{ count: number; timeline: any[] }> {
    let query = '/api/v1/incidents/timeline/replay';
    if (incidentId) query += `?incident_id=${encodeURIComponent(incidentId)}`;
    return this.request(query, { timeoutMs });
  }

  // --- Module 1: Neural Threat Detection Engine Endpoints ---
  async getDetectionHealth(timeoutMs: number = 10000): Promise<{
    status: string;
    engine: string;
    dataset_available: boolean;
    models_loaded: {
      random_forest: boolean;
      mlp_neural_network: boolean;
      isolation_forest: boolean;
      preprocessor: boolean;
    };
  }> {
    return this.request('/api/v1/detection/health', { timeoutMs });
  }

  async getDetectionModels(timeoutMs: number = 10000): Promise<DetectionModelsResponse> {
    return this.request<DetectionModelsResponse>('/api/v1/detection/models', { timeoutMs });
  }

  async getDetectionMetrics(timeoutMs: number = 10000): Promise<DetectionMetricsResponse> {
    return this.request<DetectionMetricsResponse>('/api/v1/detection/metrics', { timeoutMs });
  }

  async getDetectionHistory(
    limit: number = 50,
    offset: number = 0,
    threatStatus?: string,
    severity?: string,
    timeoutMs: number = 15000
  ): Promise<DetectionHistoryResponse> {
    let query = `/api/v1/detection/history?limit=${limit}&offset=${offset}`;
    if (threatStatus) query += `&threat_status=${encodeURIComponent(threatStatus)}`;
    if (severity) query += `&severity=${encodeURIComponent(severity)}`;
    return this.request<DetectionHistoryResponse>(query, { timeoutMs });
  }

  async analyzeEvent(
    eventData: Record<string, any>,
    timeoutMs: number = 15000
  ): Promise<StructuredThreatAlert> {
    return this.request<StructuredThreatAlert>('/api/v1/detection/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
      timeoutMs,
    });
  }

  // --- Threat Intelligence: MITRE ATT&CK & CISA KEV ---
  async getThreatIntelSummary(timeoutMs: number = 15000): Promise<import('../types').ThreatIntelSummary> {
    return this.request('/api/v1/threat-intel/summary', { timeoutMs });
  }

  async getThreatIntelAttribution(timeoutMs: number = 10000): Promise<any> {
    return this.request('/api/v1/threat-intel/attribution', { timeoutMs });
  }

  async searchMitreTechniques(params: {
    q?: string;
    tactic?: string;
    platform?: string;
    limit?: number;
    offset?: number;
  } = {}, timeoutMs: number = 15000): Promise<import('../types').MitreSearchResponse> {
    const { q, tactic, platform, limit = 50, offset = 0 } = params;
    let query = `/api/v1/threat-intel/mitre?limit=${limit}&offset=${offset}`;
    if (q) query += `&q=${encodeURIComponent(q)}`;
    if (tactic) query += `&tactic=${encodeURIComponent(tactic)}`;
    if (platform) query += `&platform=${encodeURIComponent(platform)}`;
    return this.request(query, { timeoutMs });
  }

  async getMitreTechnique(techniqueId: string, timeoutMs: number = 10000): Promise<import('../types').MitreTechnique> {
    return this.request(`/api/v1/threat-intel/mitre/${encodeURIComponent(techniqueId)}`, { timeoutMs });
  }

  async searchCisaKev(params: {
    q?: string;
    vendor?: string;
    product?: string;
    ransomware_only?: boolean;
    limit?: number;
    offset?: number;
  } = {}, timeoutMs: number = 15000): Promise<import('../types').CisaKevSearchResponse> {
    const { q, vendor, product, ransomware_only = false, limit = 50, offset = 0 } = params;
    let query = `/api/v1/threat-intel/cisa-kev?limit=${limit}&offset=${offset}`;
    if (q) query += `&q=${encodeURIComponent(q)}`;
    if (vendor) query += `&vendor=${encodeURIComponent(vendor)}`;
    if (product) query += `&product=${encodeURIComponent(product)}`;
    if (ransomware_only) query += `&ransomware_only=true`;
    return this.request(query, { timeoutMs });
  }

  async getCisaKevVulnerability(cveId: string, timeoutMs: number = 10000): Promise<import('../types').CisaKevVulnerability> {
    return this.request(`/api/v1/threat-intel/cisa-kev/${encodeURIComponent(cveId)}`, { timeoutMs });
  }

  async getAssetVulnerabilityEnrichment(assetId: string, timeoutMs: number = 15000): Promise<import('../types').AssetVulnEnrichment> {
    return this.request(`/api/v1/threat-intel/assets/${encodeURIComponent(assetId)}/vulnerabilities`, { timeoutMs });
  }

  async syncThreatIntel(force: boolean = true, timeoutMs: number = 15000): Promise<any> {
    return this.request(`/api/v1/intelligence/sync?force=${force}`, {
      method: 'POST',
      timeoutMs,
    });
  }

  // --- Unified Threat Intelligence API (Part 9 Compliant) ---
  async getIntelligenceStatus(timeoutMs: number = 15000): Promise<any> {
    return this.request('/api/v1/intelligence/status', { timeoutMs });
  }

  async getUnifiedVulnerabilities(params: {
    q?: string;
    severity?: string;
    kev_only?: boolean;
    limit?: number;
    offset?: number;
  } = {}, timeoutMs: number = 15000): Promise<import('../types').UnifiedVulnerabilityResponse> {
    const { q, severity, kev_only = false, limit = 50, offset = 0 } = params;
    let query = `/api/v1/intelligence/vulnerabilities?limit=${limit}&offset=${offset}`;
    if (q) query += `&q=${encodeURIComponent(q)}`;
    if (severity) query += `&severity=${encodeURIComponent(severity)}`;
    if (kev_only) query += `&kev_only=true`;
    return this.request(query, { timeoutMs });
  }

  async getUnifiedVulnerability(cveId: string, timeoutMs: number = 10000): Promise<import('../types').UnifiedVulnerabilityRecord> {
    return this.request(`/api/v1/intelligence/vulnerabilities/${encodeURIComponent(cveId)}`, { timeoutMs });
  }

  async getEpssScore(cveId: string, timeoutMs: number = 10000): Promise<import('../types').EpssRecord> {
    return this.request(`/api/v1/intelligence/epss/${encodeURIComponent(cveId)}`, { timeoutMs });
  }

  async explainIncident(payload: {
    incident_id?: string;
    threat_category?: string;
    affected_asset?: string;
    target_crown_jewel?: string;
    technique_ids?: string[];
    cve_ids?: string[];
    recommended_action?: string;
  }, timeoutMs: number = 15000): Promise<import('../types').IncidentExplanationResponse> {
    return this.request('/api/v1/intelligence/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeoutMs,
    });
  }
}

export const api = new ApiService();

