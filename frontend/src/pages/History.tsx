import React, { useEffect, useState } from 'react';
import { 
  Database, 
  RefreshCw, 
  Download, 
  Clock, 
  Layers,
  Activity
} from 'lucide-react';
import { api, resolveApiBaseUrl } from '../services/api';
import { IncidentRecord } from '../types';
import { IncidentTimeline } from '../components/incidents/IncidentTimeline';
import { IncidentArchive } from '../components/incidents/IncidentArchive';
import { IncidentDetails } from '../components/incidents/IncidentDetails';
import { AttackReplayEngine, TimelineReplayItem } from '../components/incidents/AttackReplayEngine';
import { OmenSectionHeader } from '../components/ui/OmenSectionHeader';
import { OmenButton } from '../components/ui/OmenButton';

export const History: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineReplayItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'archive' | 'replay'>('timeline');

  // Selected incident details
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [incRes, timelineRes] = await Promise.allSettled([
        api.getIncidents(undefined, undefined, 50, 0),
        api.getAttackReplayTimeline(),
      ]);

      if (incRes.status === 'fulfilled' && incRes.value && incRes.value.incidents) {
        setIncidents(incRes.value.incidents);
        if (incRes.value.incidents.length > 0 && !selectedIncident) {
          setSelectedIncident(incRes.value.incidents[0]);
        }
      } else {
        setIncidents([]);
      }

      if (timelineRes.status === 'fulfilled' && timelineRes.value && timelineRes.value.timeline) {
        setTimelineEvents(timelineRes.value.timeline);
      } else {
        setTimelineEvents([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load incident memory records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Export JSON dossier
  const handleExportJson = async () => {
    setIsExporting(true);
    try {
      const baseUrl = resolveApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/v1/incidents/export/json`);
      if (!res.ok) throw new Error('Failed to export incident memory archive.');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OMEN_INCIDENT_DOSSIER_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Export Error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* 1. Module Header */}
      <OmenSectionHeader 
        moduleNumber="05"
        tag="IMMUTABLE FORENSIC ARCHIVE"
        title="NOTHING GOES UNRECORDED."
        description="Cryptographically organized security incident archives. Full chronological attack timeline, multi-model score retention, MITRE ATT&CK correlation, and exportable JSON audit dossiers."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex bg-surface border border-border p-0.5 font-mono text-xs">
              <button
                onClick={() => setViewMode('replay')}
                className={`px-3 py-1 flex items-center gap-1.5 transition-colors ${
                  viewMode === 'replay' 
                    ? 'bg-crimson/20 text-crimson font-bold' 
                    : 'text-muted hover:text-chrome'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>ATTACK REPLAY</span>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1 flex items-center gap-1.5 transition-colors ${
                  viewMode === 'timeline' 
                    ? 'bg-crimson/20 text-crimson font-bold' 
                    : 'text-muted hover:text-chrome'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>CHRONOLOGY</span>
              </button>
              <button
                onClick={() => setViewMode('archive')}
                className={`px-3 py-1 flex items-center gap-1.5 transition-colors ${
                  viewMode === 'archive' 
                    ? 'bg-crimson/20 text-crimson font-bold' 
                    : 'text-muted hover:text-chrome'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>ARCHIVE</span>
              </button>
            </div>

            <OmenButton 
              variant="secondary" 
              size="sm" 
              onClick={handleExportJson}
              loading={isExporting}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Export JSON
            </OmenButton>

            <button
              onClick={fetchData}
              disabled={isLoading}
              className="p-2 bg-surface hover:bg-surface-elevated border border-border text-muted hover:text-chrome transition-colors"
              title="Refresh incident memory"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* 2. Attack Replay Engine or Timeline/Archive Grid */}
      {viewMode === 'replay' ? (
        <div className="space-y-6">
          <AttackReplayEngine 
            timeline={timelineEvents}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <IncidentTimeline 
                incidents={incidents}
                selectedId={selectedIncident?.id}
                onSelectIncident={setSelectedIncident}
              />
            </div>
            <div className="lg:col-span-5">
              <IncidentDetails 
                incident={selectedIncident}
                onClose={() => setSelectedIncident(null)}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            {viewMode === 'timeline' ? (
              <IncidentTimeline 
                incidents={incidents}
                selectedId={selectedIncident?.id}
                onSelectIncident={setSelectedIncident}
              />
            ) : (
              <IncidentArchive 
                incidents={incidents}
                selectedId={selectedIncident?.id}
                onSelectIncident={setSelectedIncident}
                onExportDossier={handleExportJson}
              />
            )}
          </div>

          <div className="lg:col-span-5">
            <IncidentDetails 
              incident={selectedIncident}
              onClose={() => setSelectedIncident(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
