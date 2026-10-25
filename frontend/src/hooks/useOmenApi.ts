import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { 
  DetectionModelsResponse, 
  DetectionMetricsResponse, 
  DetectionHistoryResponse, 
  NetworkGraphData, 
  StructuredThreatAlert, 
  DefenseSimulationResult, 
  IncidentRecord,
  TelemetryStats 
} from '../types';

// Query Keys
export const omenKeys = {
  health: ['omen', 'health'] as const,
  stats: ['omen', 'stats'] as const,
  models: ['omen', 'models'] as const,
  metrics: ['omen', 'metrics'] as const,
  history: (params?: any) => ['omen', 'history', params] as const,
  topology: (isolated?: string[]) => ['omen', 'topology', isolated] as const,
  incidents: (params?: any) => ['omen', 'incidents', params] as const,
};

// 1. System & Engine Health Hooks
export function useSystemHealth() {
  return useQuery({
    queryKey: omenKeys.health,
    queryFn: () => api.getHealth(),
    refetchInterval: 15000,
    retry: 2,
  });
}

export function useSystemStats() {
  return useQuery({
    queryKey: omenKeys.stats,
    queryFn: () => api.getStats(),
    refetchInterval: 10000,
  });
}

// 2. Module 1: Neural Detection Hooks
export function useDetectionModels() {
  return useQuery<DetectionModelsResponse>({
    queryKey: omenKeys.models,
    queryFn: () => api.getDetectionModels(),
    staleTime: 60000,
  });
}

export function useDetectionMetrics() {
  return useQuery<DetectionMetricsResponse>({
    queryKey: omenKeys.metrics,
    queryFn: () => api.getDetectionMetrics(),
    staleTime: 60000,
  });
}

export function useDetectionHistory(
  limit: number = 50,
  offset: number = 0,
  threatStatus?: string,
  severity?: string
) {
  return useQuery<DetectionHistoryResponse>({
    queryKey: omenKeys.history({ limit, offset, threatStatus, severity }),
    queryFn: () => api.getDetectionHistory(limit, offset, threatStatus, severity),
    staleTime: 5000,
  });
}

export function useAnalyzeEvent() {
  const queryClient = useQueryClient();
  return useMutation<StructuredThreatAlert, Error, Record<string, any>>({
    mutationFn: (eventData) => api.analyzeEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['omen', 'history'] });
      queryClient.invalidateQueries({ queryKey: omenKeys.stats });
    },
  });
}

// 3. Module 2: Attack Graph Topology Hooks
export function useNetworkTopology(isolatedNodes: string[] = []) {
  return useQuery<NetworkGraphData>({
    queryKey: omenKeys.topology(isolatedNodes),
    queryFn: () => api.getNetworkTopology(isolatedNodes),
    staleTime: 5000,
    refetchInterval: 12000,
  });
}

export function useNetworkAssets(params?: { zone?: string; criticality?: string; security_status?: string; search?: string }) {
  return useQuery({
    queryKey: ['omen', 'assets', params],
    queryFn: () => api.getNetworkAssets(params),
    staleTime: 5000,
  });
}

export function useNetworkAsset(assetId: string | null) {
  return useQuery({
    queryKey: ['omen', 'asset', assetId],
    queryFn: () => (assetId ? api.getNetworkAsset(assetId) : null),
    enabled: !!assetId,
    staleTime: 5000,
  });
}

export function useNetworkRelationships() {
  return useQuery({
    queryKey: ['omen', 'relationships'],
    queryFn: () => api.getNetworkRelationships(),
    staleTime: 30000,
  });
}

export function useNetworkAlerts(assetId?: string, severity?: string, limit: number = 50) {
  return useQuery({
    queryKey: ['omen', 'network_alerts', assetId, severity, limit],
    queryFn: () => api.getNetworkAlerts(assetId, severity, limit),
    staleTime: 5000,
    refetchInterval: 10000,
  });
}

export function useUnmatchedEvents(limit: number = 50) {
  return useQuery({
    queryKey: ['omen', 'unmatched_events', limit],
    queryFn: () => api.getUnmatchedEvents(limit),
    staleTime: 5000,
    refetchInterval: 12000,
  });
}

export function useLoadScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scenarioType: string) => api.loadSimulationScenario(scenarioType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['omen', 'topology'] });
      queryClient.invalidateQueries({ queryKey: ['omen', 'assets'] });
      queryClient.invalidateQueries({ queryKey: ['omen', 'network_alerts'] });
      queryClient.invalidateQueries({ queryKey: ['omen', 'stats'] });
    },
  });
}

// 4. Module 3: Attack Path Prediction Hooks
export function useAttackPaths(
  sourceNode: string,
  targetNode: string,
  isolatedNodes: string[] = [],
  maxHops: number = 5,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['omen', 'prediction', sourceNode, targetNode, isolatedNodes, maxHops],
    queryFn: () => api.predictAttackPaths(sourceNode, targetNode, isolatedNodes, maxHops),
    enabled: enabled && !!sourceNode && !!targetNode,
    staleTime: 15000,
  });
}

// 5. Module 4: Defense Simulation Hooks
export function useSimulateDefense() {
  const queryClient = useQueryClient();
  return useMutation<
    DefenseSimulationResult,
    Error,
    { isolatedNodeIds: string[]; entryNode: string }
  >({
    mutationFn: ({ isolatedNodeIds, entryNode }) =>
      api.simulateIsolation(isolatedNodeIds, entryNode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['omen', 'topology'] });
    },
  });
}

// 6. Module 5: Incident Memory Hooks
export function useIncidents(
  severity?: string,
  status?: string,
  limit: number = 50,
  offset: number = 0
) {
  return useQuery<{ total: number; offset: number; limit: number; incidents: IncidentRecord[] }>({
    queryKey: omenKeys.incidents({ severity, status, limit, offset }),
    queryFn: () => api.getIncidents(severity, status, limit, offset),
    staleTime: 5000,
  });
}
