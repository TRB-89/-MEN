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
  os?: string;
  detections_count?: number;
  last_seen?: string;
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
  risk_weight?: number;
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

export interface RiskFactorBreakdown {
  vulnerability_severity: number;
  asset_criticality: number;
  privilege_access_level: number;
  detection_evidence_level: number;
  exposure_index: number;
  path_hop_penalty: number;
}

export interface AttackPathHopDetail {
  hop_index?: number;
  from_node: string;
  from_name?: string;
  to_node: string;
  to_name?: string;
  protocol: string;
  port: number;
  relationship_type?: string;
  access_permissions?: string;
  mitre_technique?: string;
  mitre_technique_id?: string;
  mitre_technique_name?: string;
  mitre_tactic?: string;
  hop_risk: number;
  hop_risk_score?: number;
  estimated_time_mins: number;
  estimated_traversal_time_mins?: number;
  detection_indicators?: string[];
  explanation?: string;
}

export interface AttackPath {
  path_id: string;
  source_node?: string;
  target_node: string;
  target_name: string;
  nodes: string[];
  node_names?: string[];
  hops: number;
  risk_score: number;
  risk_category?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  risk_factors?: RiskFactorBreakdown;
  estimated_time_mins: number;
  hop_details: AttackPathHopDetail[];
  evidence_references?: string[];
  assumptions?: string[];
  ranking_explanation?: string;
  containment_recommendation?: string | null;
}

export interface CriticalChokepoint {
  node_id: string;
  name: string;
  frequency: number;
  criticality: string;
  recommended_action?: string;
}

export interface AttackPathPredictionRequest {
  source_asset_id: string;
  target_asset_id?: string;
  max_depth?: number;
  top_k?: number;
  isolated_nodes?: string[];
  simulation_mode?: boolean;
}

export interface AttackPathPredictionResponse {
  prediction_id: string;
  timestamp: string;
  source_asset_id: string;
  source_asset_name: string;
  target_asset_id: string | null;
  target_asset_name: string | null;
  topology_snapshot_id: string;
  total_candidate_paths: number;
  candidate_paths: AttackPath[];
  critical_chokepoints: CriticalChokepoint[];
  scoring_engine_version: string;
  simulation_mode: boolean;
  disclaimer: string;
  data_provenance: Record<string, any>;
}

export interface PredictionHistoryItem {
  prediction_id: string;
  timestamp: string;
  source_asset_id: string;
  target_asset_id: string | null;
  total_paths: number;
  highest_risk_score: number;
  risk_category: string;
  scoring_version: string;
  is_simulation: boolean;
}

export interface CriticalAssetItem {
  id: string;
  name: string;
  zone: string;
  criticality: string;
  asset_type: string;
  ip?: string | null;
  vuln_score: number;
  security_status: string;
}

export interface EngineHealthResponse {
  status: string;
  engine: string;
  version: string;
  algorithm: string;
  topology_loaded: boolean;
  total_nodes: number;
  total_edges: number;
  graph_density: number;
  scoring_model: string;
}

export interface DefenseSimulationHandoff {
  prediction_id: string;
  source_asset_id: string;
  critical_target_id?: string;
  topology_snapshot_id: string;
  ranked_candidate_paths: AttackPath[];
  affected_assets: string[];
  primary_risk_factors: Record<string, number>;
  available_containment_points: Array<{
    node_id: string;
    node_name: string;
    criticality: string;
    blast_radius_reduction_pct: number;
    affected_paths_count: number;
    recommendation_reason: string;
  }>;
  scoring_version: string;
  handoff_timestamp: string;
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

export interface SimulationMetrics {
  blast_radius_before: number;
  blast_radius_after: number;
  containment_efficacy_pct: number;
  severed_edges_count: number;
  critical_assets_saved_count: number;
  residual_critical_exposed_count: number;
  risk_score_before: number;
  risk_score_after: number;
  risk_reduction_pct: number;
  operational_disruption_score: number;
  net_defensive_utility: number;
}

export interface BusinessImpactAnalysis {
  disrupted_legitimate_services: string[];
  affected_departments: string[];
  estimated_downtime_minutes: number;
  operational_friction: string;
  critical_business_functions_maintained: string[];
}

export interface DefenseSimulationRequest {
  action_type: string;
  target_entity: string;
  entry_node?: string;
  target_asset_id?: string;
  prediction_id?: string;
  max_hops?: number;
}

export interface DefenseSimulationResponse {
  simulation_id: string;
  timestamp: string;
  action_type: string;
  target_entity: string;
  target_name: string;
  entry_node: string;
  entry_node_name: string;
  crown_jewel_target?: string | null;
  topology_snapshot_id: string;
  prediction_id?: string | null;
  metrics: SimulationMetrics;
  business_impact: BusinessImpactAnalysis;
  reachability_comparison: {
    reachable_nodes_before: string[];
    reachable_nodes_after: string[];
    critical_exposed_before: string[];
    critical_exposed_after: string[];
    protected_crown_jewels: string[];
  };
  interrupted_attack_paths: string[];
  remaining_attack_paths: Array<{
    nodes: string[];
    hops: number;
    risk_score: number;
    risk_category: string;
    estimated_time_mins: number;
    explanation: string;
  }>;
  explanation: string;
  assumptions: string[];
  approval_status: string;
  disclaimer: string;
}

export interface DefenseRecommendationItem {
  recommendation_id: string;
  rank: number;
  action_type: string;
  target_entity: string;
  target_name: string;
  target_zone: string;
  projected_risk_reduction_pct: number;
  operational_disruption_pct: number;
  net_utility_score: number;
  confidence_score: number;
  rationale: string;
  affected_paths_count: number;
  critical_assets_shielded: number;
  decision_tradeoff: string;
}

export interface DefenseRecommendationRequest {
  prediction_id?: string;
  entry_node?: string;
  target_asset_id?: string;
  max_recommendations?: number;
  risk_weight?: number;
  disruption_weight?: number;
}

export interface DefenseRecommendationResponse {
  recommendation_id: string;
  timestamp: string;
  entry_node: string;
  crown_jewel_target?: string | null;
  prediction_id?: string | null;
  topology_snapshot_id: string;
  recommended_strategy: DefenseRecommendationItem;
  alternative_strategies: DefenseRecommendationItem[];
  scoring_weights: {
    risk_weight: number;
    disruption_weight: number;
  };
  summary: string;
  disclaimer: string;
}

export interface DefenseApprovalRequest {
  simulation_id: string;
  analyst_id?: string;
  decision: 'APPROVED' | 'REJECTED';
  notes?: string;
}

export interface DefenseApprovalResponse {
  approval_id: string;
  simulation_id: string;
  analyst_id: string;
  decision: string;
  notes?: string;
  approved_at: string;
  audit_message: string;
}

export type DefenseActionType = 
  | 'WORKSTATION_ISOLATION'
  | 'CONNECTION_RESTRICTION'
  | 'SESSION_REVOCATION'
  | 'ENHANCED_MONITORING';

export interface DefenseHistoryItem {
  simulation_id: string;
  timestamp: string;
  action_type: string;
  target_entity: string;
  risk_before: number;
  risk_after: number;
  risk_score_before?: number;
  risk_score_after?: number;
  risk_reduction_pct: number;
  disruption_score: number;
  net_utility?: number;
  approval_status: string;
}

export interface DefenseEngineHealth {
  status: string;
  engine: string;
  version: string;
  supported_actions: string[];
  baseline_topology_nodes: number;
  baseline_topology_edges: number;
  isolation_safety_guarantee: string;
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

export interface MitreTechnique {
  id: string;
  name: string;
  description: string;
  tactics: string[];
  platforms: string[];
  url: string;
  is_subtechnique: boolean;
  created?: string;
  modified?: string;
  detection?: string;
}

export interface MitreSearchResponse {
  total: number;
  count: number;
  limit: number;
  offset: number;
  query?: string | null;
  tactic?: string | null;
  platform?: string | null;
  results: MitreTechnique[];
}

export interface CisaKevVulnerability {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate?: string | null;
  knownRansomwareCampaignUse?: string | null;
  forensicTriage?: string | null;
  notes?: string | null;
  cwes?: string[] | null;
}

export interface CisaKevSearchResponse {
  total: number;
  count: number;
  limit: number;
  offset: number;
  query?: string | null;
  vendor?: string | null;
  product?: string | null;
  ransomware_only: boolean;
  results: CisaKevVulnerability[];
}

export interface ThreatIntelSummary {
  status: string;
  offline_ready: boolean;
  mitre_attack: {
    total_techniques: number;
    tactics_count: number;
    tactics_breakdown: Record<string, number>;
    spec_version: string;
    source_repository: string;
  };
  cisa_kev: {
    total_vulnerabilities: number;
    known_ransomware_associated: number;
    catalog_version: string;
    source_repository: string;
  };
  last_synced_utc?: string | null;
  attribution: Record<string, any>;
}

export interface AssetVulnMatch {
  cve_id: string;
  matched_by: string;
  in_cisa_kev: boolean;
  vulnerability_name?: string | null;
  vendor_project?: string | null;
  product?: string | null;
  short_description?: string | null;
  date_added?: string | null;
  due_date?: string | null;
  required_action?: string | null;
  known_ransomware_campaign_use?: string | null;
  notes_url?: string | null;
  nvd_url: string;
}

export interface AssetVulnEnrichment {
  asset_id: string;
  asset_name: string;
  vulnerabilities_count: number;
  cisa_kev_matches_count: number;
  matches: AssetVulnMatch[];
  attribution_notice: string;
}

export interface EpssRecord {
  cve_id: string;
  epss_score: number;
  percentile: number;
  interpretation: string;
  model_version?: string | null;
  score_date?: string | null;
}

export interface UnifiedVulnerabilityRecord {
  cve_id: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  cvss_v3_score?: number | null;
  cvss_v3_vector?: string | null;
  cvss_v2_score?: number | null;
  affected_products: string[];
  published_date?: string | null;
  modified_date?: string | null;
  references: string[];
  in_cisa_kev: boolean;
  cisa_action?: string | null;
  cisa_due_date?: string | null;
  known_ransomware: boolean;
  epss?: EpssRecord | null;
}

export interface UnifiedVulnerabilityResponse {
  total: number;
  count: number;
  limit: number;
  offset: number;
  query?: string | null;
  severity?: string | null;
  kev_only: boolean;
  vulnerabilities: UnifiedVulnerabilityRecord[];
}

export interface IncidentExplanationResponse {
  incident_id?: string | null;
  generator: string;
  model: string;
  summary: string;
  tactical_analysis: string;
  vulnerability_context: string;
  containment_rationale: string;
  disclaimer: string;
}

