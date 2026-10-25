import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Defense } from '../pages/Defense';
import { api } from '../services/api';

// Mock the API client
vi.mock('../services/api', () => ({
  api: {
    getNetworkTopology: vi.fn(),
    predictAttackPathsV2: vi.fn(),
    getDefenseRecommendations: vi.fn(),
    runDefenseSimulation: vi.fn(),
    submitDefenseApproval: vi.fn(),
    getDefenseSimulations: vi.fn(),
    getDefenseSimulationById: vi.fn(),
    simulateIsolation: vi.fn(),
  },
}));

describe('Module 4: Autonomous Defense Simulation Engine', () => {
  const mockTopology = {
    nodes_count: 5,
    edges_count: 5,
    isolated_nodes: [],
    nodes: [
      { id: 'srv-web-01', name: 'Web Ingress Gateway', zone: 'DMZ', criticality: 'HIGH', ip: '192.168.1.10', device_type: 'gateway', compromised: true },
      { id: 'srv-app-01', name: 'App Proxy Server', zone: 'APPLICATION', criticality: 'HIGH', ip: '10.0.1.20', device_type: 'server' },
      { id: 'db-prod-01', name: 'Production Database', zone: 'DATABASE', criticality: 'CRITICAL', ip: '10.0.2.50', device_type: 'database' },
    ],
    edges: [
      { id: 'e1', source: 'srv-web-01', target: 'srv-app-01', protocol: 'HTTPS', port: 443 },
      { id: 'e2', source: 'srv-app-01', target: 'db-prod-01', protocol: 'POSTGRES', port: 5432 },
    ],
  };

  const mockPrediction = {
    prediction_id: 'PRED-TEST-001',
    timestamp: '2026-10-25T12:00:00Z',
    source_asset_id: 'srv-web-01',
    source_asset_name: 'Web Ingress Gateway',
    target_asset_id: 'db-prod-01',
    target_asset_name: 'Production Database',
    topology_snapshot_id: 'SNAP-001',
    total_candidate_paths: 2,
    candidate_paths: [
      {
        path_id: 'path-1',
        target_node: 'db-prod-01',
        target_name: 'Production Database',
        nodes: ['srv-web-01', 'srv-app-01', 'db-prod-01'],
        hops: 2,
        risk_score: 88.5,
        estimated_time_mins: 18,
        hop_details: [],
      },
    ],
    critical_chokepoints: [
      { node_id: 'srv-app-01', name: 'App Proxy Server', frequency: 1, criticality: 'HIGH' }
    ],
    scoring_engine_version: '3.0.0',
    simulation_mode: true,
    disclaimer: 'Simulation only',
    data_provenance: {},
  };

  const mockRecommendations = {
    recommendation_id: 'REC-TEST-001',
    timestamp: '2026-10-25T12:00:00Z',
    entry_node: 'srv-web-01',
    crown_jewel_target: 'db-prod-01',
    topology_snapshot_id: 'SNAP-001',
    recommended_strategy: {
      recommendation_id: 'STRAT-1',
      rank: 1,
      action_type: 'WORKSTATION_ISOLATION',
      target_entity: 'srv-app-01',
      target_name: 'App Proxy Server',
      target_zone: 'APPLICATION',
      projected_risk_reduction_pct: 74.2,
      operational_disruption_pct: 15.0,
      net_utility_score: 0.81,
      confidence_score: 0.95,
      rationale: 'Quarantining application proxy severs primary lateral attack route.',
      affected_paths_count: 1,
      critical_assets_shielded: 1,
      decision_tradeoff: 'High risk reduction with minimal operational impact.',
    },
    alternative_strategies: [],
    scoring_weights: { risk_weight: 0.7, disruption_weight: 0.3 },
    summary: 'Optimal defensive action identified.',
    disclaimer: 'Simulation model only.',
  };

  const mockSimulationResponse = {
    simulation_id: 'SIM-TEST-001',
    timestamp: '2026-10-25T12:00:00Z',
    action_type: 'WORKSTATION_ISOLATION',
    target_entity: 'srv-app-01',
    target_name: 'App Proxy Server',
    entry_node: 'srv-web-01',
    entry_node_name: 'Web Ingress Gateway',
    crown_jewel_target: 'db-prod-01',
    topology_snapshot_id: 'SNAP-001',
    metrics: {
      blast_radius_before: 5,
      blast_radius_after: 1,
      containment_efficacy_pct: 80.0,
      severed_edges_count: 2,
      critical_assets_saved_count: 1,
      residual_critical_exposed_count: 0,
      risk_score_before: 88.5,
      risk_score_after: 22.0,
      risk_reduction_pct: 75.1,
      operational_disruption_score: 15.0,
      net_defensive_utility: 0.82,
    },
    business_impact: {
      disrupted_legitimate_services: ['Internal API Proxy'],
      affected_departments: ['Engineering'],
      estimated_downtime_minutes: 10,
      operational_friction: 'MINIMAL',
      critical_business_functions_maintained: ['Billing Service', 'Production Database'],
    },
    reachability_comparison: {
      reachable_nodes_before: ['srv-web-01', 'srv-app-01', 'db-prod-01'],
      reachable_nodes_after: ['srv-web-01'],
      critical_exposed_before: ['db-prod-01'],
      critical_exposed_after: [],
      protected_crown_jewels: ['db-prod-01'],
    },
    interrupted_attack_paths: ['srv-web-01 ➔ srv-app-01 ➔ db-prod-01'],
    remaining_attack_paths: [],
    explanation: 'Workstation isolation eliminated attack pathway completely.',
    assumptions: ['Zero-trust network partition', 'Cloned NetworkX simulation graph'],
    approval_status: 'PENDING_APPROVAL',
    disclaimer: 'Zero changes executed to production infrastructure.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (api.getNetworkTopology as any).mockResolvedValue(mockTopology);
    (api.predictAttackPathsV2 as any).mockResolvedValue(mockPrediction);
    (api.getDefenseRecommendations as any).mockResolvedValue(mockRecommendations);
    (api.runDefenseSimulation as any).mockResolvedValue(mockSimulationResponse);
    (api.getDefenseSimulations as any).mockResolvedValue([]);
  });

  it('renders Module 04 section header and BLACKSITE headline', async () => {
    render(
      <MemoryRouter>
        <Defense />
      </MemoryRouter>
    );

    expect(screen.getByText(/MODULE 04/i)).toBeInTheDocument();
    expect(screen.getByText(/CONTROL THE DAMAGE. PRESERVE THE SYSTEM./i)).toBeInTheDocument();
    expect(
      screen.getByText(/Evaluate defensive responses, simulate containment/i)
    ).toBeInTheDocument();
  });

  it('renders all four defense action archetypes (Actions A, B, C, D)', async () => {
    render(
      <MemoryRouter>
        <Defense />
      </MemoryRouter>
    );

    expect(screen.getByText(/Node Isolation/i)).toBeInTheDocument();
    expect(screen.getByText(/Connection Restriction/i)).toBeInTheDocument();
    expect(screen.getByText(/Session Revocation/i)).toBeInTheDocument();
    expect(screen.getByText(/Enhanced Monitoring/i)).toBeInTheDocument();
  });

  it('renders Threat Context and Prediction Summary panels with real mock telemetry', async () => {
    render(
      <MemoryRouter>
        <Defense />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/MODULE 01 THREAT INTELLIGENCE CONTEXT/i)).toBeInTheDocument();
      expect(screen.getByText(/MODULE 03 ATTACK PATH PREDICTION HANDOFF/i)).toBeInTheDocument();
    });
  });

  it('opens SecOps Approval dialog when user clicks SecOps Approval button', async () => {
    render(
      <MemoryRouter>
        <Defense />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/SecOps Approval/i)).toBeInTheDocument();
    });

    const approvalBtn = screen.getByRole('button', { name: /SecOps Approval/i });
    fireEvent.click(approvalBtn);

    await waitFor(() => {
      expect(screen.getByText(/DEFENSE SIMULATION APPROVAL DOSSIER/i)).toBeInTheDocument();
      expect(screen.getByText(/Approve Simulation Plan/i)).toBeInTheDocument();
      expect(screen.getByText(/Reject Plan/i)).toBeInTheDocument();
    });
  });
});
