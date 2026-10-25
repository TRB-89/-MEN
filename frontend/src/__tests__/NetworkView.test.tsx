import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NetworkView } from '../pages/NetworkView';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    getNetworkTopology: vi.fn(),
    getNetworkAlerts: vi.fn(),
    getUnmatchedEvents: vi.fn(),
    getDetectionModels: vi.fn(),
    loadSimulationScenario: vi.fn(),
    analyzeEvent: vi.fn(),
  },
}));

const mockTopology = {
  nodes_count: 3,
  edges_count: 2,
  isolated_nodes: [],
  nodes: [
    {
      id: 'ws-dev-04',
      name: 'Lead Developer Workstation',
      zone: 'Corporate',
      subnet: '10.0.3.0/24',
      ip: '10.0.3.104',
      device_type: 'workstation',
      criticality: 'MEDIUM' as const,
      security_status: 'COMPROMISED' as const,
      vulnerabilities: ['Embedded SSH Keys'],
      vuln_score: 0.8,
      isolated: false,
      compromised: true,
      active_alerts_count: 1,
      associated_alerts: [],
    },
    {
      id: 'dc-01',
      name: 'Primary Active Directory DC',
      zone: 'Core',
      subnet: '10.0.2.0/24',
      ip: '10.0.2.10',
      device_type: 'domain_controller',
      criticality: 'CRITICAL' as const,
      security_status: 'SUSPICIOUS' as const,
      vulnerabilities: ['CVE-2020-1472'],
      vuln_score: 0.9,
      isolated: false,
      compromised: false,
      active_alerts_count: 0,
      associated_alerts: [],
    },
    {
      id: 'db-prod-01',
      name: 'Core SQL Database',
      zone: 'Restricted',
      subnet: '10.0.4.0/24',
      ip: '10.0.4.50',
      device_type: 'database',
      criticality: 'CRITICAL' as const,
      security_status: 'SECURE' as const,
      vulnerabilities: [],
      vuln_score: 0.1,
      isolated: false,
      compromised: false,
      active_alerts_count: 0,
      associated_alerts: [],
    },
  ],
  edges: [
    {
      id: 'e1',
      source: 'ws-dev-04',
      target: 'dc-01',
      protocol: 'Kerberos',
      port: 88,
      weight: 1.0,
      relationship_type: 'AUTHENTICATES_TO',
      access_permissions: 'ALLOW TCP/88',
      observation_source: 'NETFLOW_TELEMETRY',
    },
    {
      id: 'e2',
      source: 'dc-01',
      target: 'db-prod-01',
      protocol: 'TDS/SQL',
      port: 1433,
      weight: 1.5,
      relationship_type: 'DB_CLIENT',
      access_permissions: 'ALLOW TCP/1433',
      observation_source: 'FIREWALL_CONFIG',
    },
  ],
  metrics: {
    density: 0.33,
    weakly_connected_components: 1,
    compromised_count: 1,
    suspicious_count: 1,
    isolated_count: 0,
    secure_count: 1,
    total_assets: 3,
    total_relationships: 2,
  },
};

describe('Module 2: NetworkView Page', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    (api.getNetworkTopology as any).mockResolvedValue(mockTopology);
    (api.getNetworkAlerts as any).mockResolvedValue({
      count: 1,
      alerts: [
        {
          id: 'ALT-001',
          asset_id: 'ws-dev-04',
          detection_id: 'DET-001',
          threat_status: 'MALICIOUS',
          severity: 'HIGH',
          attack_category: 'Kerberoasting',
          decision_rule: 'CONSENSUS_SUPERVISED_ATTACK',
          model_scores: { rf_probability: 0.88, anomaly_index: 0.76 },
          supporting_evidence: {},
          is_matched: true,
          timestamp: new Date().toISOString(),
        },
      ],
    });
    (api.getUnmatchedEvents as any).mockResolvedValue({
      count: 0,
      unmatched_events: [],
    });
    (api.getDetectionModels as any).mockResolvedValue({
      timestamp: new Date().toISOString(),
      models: {
        random_forest: { status: 'trained', model_type: 'RandomForest' },
        isolation_forest: { status: 'trained', model_type: 'IsolationForest' },
        mlp_neural_network: { status: 'not_trained', model_type: 'MLP' },
      },
      preprocessor: { status: 'trained' },
    });
  });

  it('renders Module 2 header and subtitle correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NetworkView />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/THE NETWORK HAS A MEMORY/i)).toBeInTheDocument();
    expect(screen.getByText(/Visualize infrastructure, correlate suspicious activity/i)).toBeInTheDocument();
    expect(screen.getByText(/ATTACK GRAPH INTELLIGENCE/i)).toBeInTheDocument();
  });

  it('renders simulation scenario triggers', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NetworkView />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/RESET BASELINE/i)).toBeInTheDocument();
    expect(screen.getByText(/KERBEROASTING/i)).toBeInTheDocument();
    expect(screen.getByText(/DMZ WEB EXPLOIT/i)).toBeInTheDocument();
    expect(screen.getByText(/INJECT FLOW EVENT/i)).toBeInTheDocument();
  });

  it('renders asset inspector panel with telemetry', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NetworkView />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/ASSET INTELLIGENCE/i)).toBeInTheDocument();
      expect(screen.getByText(/Lead Developer Workstation/i)).toBeInTheDocument();
    });
  });
});
