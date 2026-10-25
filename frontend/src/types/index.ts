/**
 * Type definitions matching NØX FastAPI backend schemas.
 */

export interface HealthStatus {
  status: 'ready' | 'online' | 'uninitialized' | 'error';
  model_loaded: boolean;
  system?: string;
  version?: string;
  model_version?: string;
  database?: string;
  threshold?: number | null;
  device?: string | null;
  topology_devices_count?: number;
}

export interface TelemetryStats {
  total_records_analyzed: number;
  predicted_normal_count: number;
  predicted_malicious_count: number;
  attack_percentage: number;
  severity_distribution: {
    Normal: number;
    Low: number;
    Medium: number;
    High: number;
  };
  most_recent_detection_timestamp: string | null;
}

export interface DetectionResult {
  prediction: string;
  class_id: number;
  attack_score: number;
  threshold: number;
  severity: 'Normal' | 'Low' | 'Medium' | 'High';
  model: string;
  timestamp: string;
}

export interface CSVUploadResponse {
  status: string;
  total_records_analyzed: number;
  normal_traffic_count: number;
  potential_attack_count: number;
  attack_percentage: number;
  severity_distribution: {
    Normal: number;
    Low: number;
    Medium: number;
    High: number;
  };
  preview_limit: number;
  preview_predictions: DetectionResult[];
}

export interface DetectionEvent {
  id: number;
  timestamp: string;
  prediction: string;
  class_id: number;
  attack_score: number;
  threshold: number;
  severity: 'Normal' | 'Low' | 'Medium' | 'High';
  model_version: string;
  source_type: string;
}

export interface FlowRecord {
  dur?: number;
  proto?: string;
  service?: string;
  state?: string;
  spkts?: number;
  dpkts?: number;
  sbytes?: number;
  dbytes?: number;
  rate?: number;
  sttl?: number;
  dttl?: number;
  sload?: number;
  dload?: number;
  [key: string]: any;
}

export interface ModelEvaluationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  false_positive_rate: number;
  roc_auc: number;
  confusion_matrix: {
    tn: number;
    fp: number;
    fn: number;
    tp: number;
  };
  threshold_used: number;
}

export interface NetworkNode {
  id: string;
  name: string;
  zone: string;
  subnet?: string;
  ip: string;
  device_type: string;
  asset_type?: string;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  security_status: 'SECURE' | 'SUSPICIOUS' | 'COMPROMISED' | 'ISOLATED';
  vulnerabilities: string[];
  vuln_score: number;
  isolated: boolean;
  compromised: boolean;
  active_alerts_count?: number;
  last_activity?: string;
  associated_alerts?: NetworkAlert[];
  in_neighbors?: Array<{ neighbor_id: string; protocol: string; port: number; relationship_type: string; access_permissions?: string }>;
  out_neighbors?: Array<{ neighbor_id: string; protocol: string; port: number; relationship_type: string; access_permissions?: string }>;
  in_degree?: number;
  out_degree?: number;
  permitted_routes?: Array<{ target: string; hops: number; path: string[] }>;
}

export interface NetworkEdge {
  id?: string;
  source: string;
  target: string;
  protocol: string;
  port: number;
  weight: number;
  relationship_type?: string;
  direction?: string;
  access_permissions?: string;
  observation_source?: string;
}

export interface NetworkGraphMetrics {
  density: number;
  weakly_connected_components: number;
  compromised_count: number;
  suspicious_count: number;
  isolated_count: number;
  secure_count: number;
  total_assets: number;
  total_relationships: number;
}

export interface NetworkGraphData {
  nodes_count: number;
  edges_count: number;
  isolated_nodes: string[];
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  metrics?: NetworkGraphMetrics;
}

export interface NetworkAlert {
  id: string;
  asset_id?: string | null;
  detection_id: string;
  threat_status: 'MALICIOUS' | 'SUSPICIOUS' | 'BENIGN';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  attack_category?: string | null;
  decision_rule?: string | null;
  model_scores: {
    rf_probability?: number | null;
    mlp_probability?: number | null;
    anomaly_index?: number | null;
    is_anomaly?: boolean;
    [key: string]: any;
  };
  supporting_evidence: Record<string, any>;
  is_matched: boolean;
  raw_event_data?: Record<string, any>;
  timestamp: string;
}

export interface UnmatchedEvent extends NetworkAlert {}

export interface ScenarioLoadResponse {
  status: string;
  scenario: string;
  summary: string;
  timestamp: string;
  topology: NetworkGraphData;
}

export interface AttackPath {
  path_id: string;
  target_node: string;
  target_name: string;
  nodes: string[];
  hops: number;
  risk_score: number;
  estimated_time_mins: number;
  hop_details: Array<{
    from_node: string;
    to_node: string;
    protocol: string;
    port: number;
    mitre_technique: string;
    hop_risk: number;
    estimated_time_mins: number;
  }>;
}

export interface DefenseSimulationResult {
  simulation_mode: string;
  entry_node: string;
  entry_node_name: string;
  isolated_nodes: string[];
  metrics: {
    blast_radius_before: number;
    blast_radius_after: number;
    containment_efficacy_pct: number;
    severed_edges_count: number;
    critical_assets_saved_count: number;
  };
  summary: string;
}

export interface IncidentRecord {
  id: string;
  title: string;
  severity: string;
  status: string;
  description: string;
  affected_nodes: string[];
  mitre_technique: string;
  created_at: string;
  updated_at?: string;
}

// ==========================================
// ØMEN MODULE 1: NEURAL THREAT DETECTION ENGINE
// ==========================================

export interface ModelMetadata {
  status: 'trained' | 'not_trained';
  model_type: string;
  artifact_path?: string;
  [key: string]: any;
}

export interface DetectionModelsResponse {
  timestamp: string;
  models: {
    random_forest: ModelMetadata;
    mlp_neural_network: ModelMetadata;
    isolation_forest: ModelMetadata;
  };
  preprocessor: {
    status: 'trained' | 'not_trained';
    raw_features_count?: number;
    transformed_features_dim?: number;
    artifact_path?: string;
  };
}

export interface DetectionMetricsResponse {
  timestamp: string;
  evaluation_dataset: string;
  models: {
    random_forest?: {
      accuracy: number;
      precision: number;
      recall: number;
      f1_score: number;
      roc_auc: number;
      confusion_matrix: { tn: number; fp: number; fn: number; tp: number };
      test_samples: number;
      [key: string]: any;
    };
    mlp_neural_network?: {
      accuracy: number;
      precision: number;
      recall: number;
      f1_score: number;
      roc_auc: number;
      confusion_matrix: { tn: number; fp: number; fn: number; tp: number };
      test_samples: number;
      [key: string]: any;
    };
    isolation_forest?: {
      threshold: number;
      fit_on: string;
      precision: number;
      recall: number;
      false_positive_rate: number;
      f1_score: number;
      [key: string]: any;
    };
  };
}

export interface StructuredThreatAlert {
  event_id: string;
  timestamp: string;
  device_id?: string | null;
  threat_status: 'MALICIOUS' | 'SUSPICIOUS' | 'BENIGN';
  attack_category: string;
  model_scores: {
    rf_probability: number | null;
    mlp_probability: number | null;
    anomaly_index: number | null;
  };
  decision_threshold: number;
  decision_rule: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  model_versions: Record<string, string>;
  explanation: string;
  supporting_evidence: Record<string, any>;
  classification?: string;
  anomaly_score?: number;
}

export interface DetectionRecordItem {
  detection_id: string;
  event_timestamp: string;
  device_id?: string | null;
  threat_status: 'MALICIOUS' | 'SUSPICIOUS' | 'BENIGN';
  detected_attack_cat?: string | null;
  rf_score: number | null;
  mlp_score: number | null;
  anomaly_score: number | null;
  alert_severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  decision_rule: string;
  supporting_evidence: Record<string, any>;
  model_version?: string | null;
  processing_timestamp?: string | null;
}

export interface DetectionHistoryResponse {
  total: number;
  limit: number;
  offset: number;
  records: DetectionRecordItem[];
}

