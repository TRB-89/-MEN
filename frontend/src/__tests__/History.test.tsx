import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { History } from '../pages/History';
import { api } from '../services/api';

const mockIncidents = [
  {
    id: 'INC-2026-00101',
    title: 'Lateral Movement Toward Database',
    severity: 'HIGH',
    status: 'ACTIVE',
    description: 'Compromised web server attempted lateral SMB traversal',
    affected_nodes: ['srv-db-01', 'srv-web-01'],
    mitre_technique: 'T1021.002',
    created_at: '2026-10-22T21:15:00Z',
  },
  {
    id: 'INC-2026-00102',
    title: 'Workstation Anomaly Observed',
    severity: 'LOW',
    status: 'CONTAINED',
    description: 'Unusual outbound DNS requests detected by Isolation Forest',
    affected_nodes: ['ws-finance-03'],
    mitre_technique: 'T1071.004',
    created_at: '2026-10-22T21:16:00Z',
  },
];

vi.mock('../services/api', () => ({
  api: {
    getIncidents: vi.fn(),
    getHistory: vi.fn(),
    getAttackReplayTimeline: vi.fn().mockResolvedValue({ count: 0, timeline: [] }),
  },
  resolveApiBaseUrl: vi.fn(() => 'http://127.0.0.1:8000'),
}));

describe('Incident Memory & Forensic History Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders incident memory header and timeline records', async () => {
    (api.getIncidents as any).mockResolvedValue({
      total: 2,
      offset: 0,
      limit: 50,
      incidents: mockIncidents,
    });

    render(
      <MemoryRouter>
        <History />
      </MemoryRouter>
    );

    expect(screen.getByText('NOTHING GOES UNRECORDED.')).toBeInTheDocument();
    expect(screen.getByText('IMMUTABLE FORENSIC ARCHIVE')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText(/Lateral Movement Toward Database/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Workstation Anomaly Observed/i).length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText(/HIGH/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/LOW/i).length).toBeGreaterThan(0);
  });

  it('shows empty state when no historical events exist', async () => {
    (api.getIncidents as any).mockResolvedValue({
      total: 0,
      offset: 0,
      limit: 50,
      incidents: [],
    });

    render(
      <MemoryRouter>
        <History />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/No incident timeline events recorded in the current security epoch/i)
      ).toBeInTheDocument();
    });
  });
});
