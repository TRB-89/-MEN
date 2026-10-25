import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Overview } from '../pages/Overview';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    getStats: vi.fn(),
    getDetectionHistory: vi.fn(),
    getNetworkTopology: vi.fn(),
    getDetectionModels: vi.fn(),
    predictAttackPaths: vi.fn(),
  },
  resolveApiBaseUrl: vi.fn(() => 'http://127.0.0.1:8000'),
}));

vi.mock('../services/BackendContext', () => ({
  useBackend: () => ({ isOnline: true }),
}));

describe('Overview Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockStats = {
    total_records_analyzed: 4500,
    predicted_normal_count: 3200,
    predicted_malicious_count: 1300,
    attack_percentage: 28.89,
    severity_distribution: {
      Normal: 3200,
      Low: 200,
      Medium: 600,
      High: 500,
    },
    most_recent_detection_timestamp: '2026-10-22T20:00:00Z',
  };

  const mockTopology = {
    nodes_count: 16,
    edges_count: 22,
    isolated_nodes: [],
    nodes: [
      { id: 'srv-web-01', name: 'Web Ingress', zone: 'DMZ', compromised: true, criticality: 'HIGH' },
      { id: 'db-prod-01', name: 'Production Database', zone: 'INTERNAL', compromised: false, criticality: 'CRITICAL' },
    ],
    edges: [],
  };

  const mockHistory = {
    total_records: 1,
    offset: 0,
    limit: 10,
    records: [
      {
        id: 'EVT-001',
        timestamp: '2026-10-22T20:00:00Z',
        threat_status: 'MALICIOUS',
        severity: 'HIGH',
        attack_category: 'Exploit',
        device_id: 'srv-web-01',
      },
    ],
  };

  it('renders Module 06 The ØMEN Console header and telemetry overview', async () => {
    (api.getStats as any).mockResolvedValue(mockStats);
    (api.getNetworkTopology as any).mockResolvedValue(mockTopology);
    (api.getDetectionHistory as any).mockResolvedValue(mockHistory);
    (api.getDetectionModels as any).mockResolvedValue({ status: 'online', models: [] });
    (api.predictAttackPaths as any).mockResolvedValue({ paths: [] });

    render(
      <MemoryRouter>
        <Overview />
      </MemoryRouter>
    );

    expect(screen.getByText('THE ØMEN CONSOLE.')).toBeInTheDocument();
    expect(screen.getByText('DEFCON 3 POSTURE')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('4,500')).toBeInTheDocument();
    });
  });

  it('handles zero telemetry gracefully', async () => {
    (api.getStats as any).mockResolvedValue({
      total_records_analyzed: 0,
      predicted_normal_count: 0,
      predicted_malicious_count: 0,
      attack_percentage: 0.0,
      severity_distribution: { Normal: 0, Low: 0, Medium: 0, High: 0 },
      most_recent_detection_timestamp: null,
    });
    (api.getNetworkTopology as any).mockResolvedValue({ nodes_count: 0, edges_count: 0, isolated_nodes: [], nodes: [], edges: [] });
    (api.getDetectionHistory as any).mockResolvedValue({ total_records: 0, offset: 0, limit: 10, records: [] });
    (api.getDetectionModels as any).mockResolvedValue({ status: 'online', models: [] });
    (api.predictAttackPaths as any).mockResolvedValue({ paths: [] });

    render(
      <MemoryRouter>
        <Overview />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('THE ØMEN CONSOLE.')).toBeInTheDocument();
    });
  });
});
