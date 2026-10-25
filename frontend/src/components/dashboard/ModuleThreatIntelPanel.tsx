import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Server, 
  Sparkles,
  Bot,
  Zap,
  TrendingUp,
  FileCode,
  Lock
} from 'lucide-react';
import { api } from '../../services/api';
import { 
  ThreatIntelSummary, 
  MitreTechnique, 
  CisaKevVulnerability, 
  AssetVulnEnrichment,
  IncidentExplanationResponse
} from '../../types';

export const ModuleThreatIntelPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mitre' | 'vulnerabilities' | 'assets' | 'ai'>('mitre');
  const [summary, setSummary] = useState<ThreatIntelSummary | null>(null);
  const [intelStatus, setIntelStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // MITRE state
  const [mitreQuery, setMitreQuery] = useState<string>('');
  const [selectedTactic, setSelectedTactic] = useState<string>('');
  const [mitreResults, setMitreResults] = useState<MitreTechnique[]>([]);
  const [mitreTotal, setMitreTotal] = useState<number>(0);
  const [isMitreLoading, setIsMitreLoading] = useState<boolean>(false);
  const [expandedTechniqueId, setExpandedTechniqueId] = useState<string | null>(null);

  // Vulnerabilities & KEV state
  const [vulnQuery, setVulnQuery] = useState<string>('');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [ransomwareOnly, setRansomwareOnly] = useState<boolean>(false);
  const [vulnResults, setVulnResults] = useState<CisaKevVulnerability[]>([]);
  const [vulnTotal, setVulnTotal] = useState<number>(0);
  const [isVulnLoading, setIsVulnLoading] = useState<boolean>(false);
  const [expandedCveId, setExpandedCveId] = useState<string | null>(null);

  // Asset Correlation state
  const [selectedAssetId, setSelectedAssetId] = useState<string>('gw-ext-01');
  const [assetEnrichment, setAssetEnrichment] = useState<AssetVulnEnrichment | null>(null);
  const [isAssetLoading, setIsAssetLoading] = useState<boolean>(false);

  // Local AI / Ollama Assistant state
  const [aiExplanation, setAiExplanation] = useState<IncidentExplanationResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiCategory, setAiCategory] = useState<string>('Exploitation');
  const [aiAsset, setAiAsset] = useState<string>('srv-web-01');

  // Initial data load
  useEffect(() => {
    loadSummary();
    executeMitreSearch('', '');
    executeVulnSearch('', '', false);
    loadAssetVulnerabilities('gw-ext-01');
  }, []);

  const loadSummary = async () => {
    if (typeof api.getThreatIntelSummary !== 'function') return;
    setIsLoading(true);
    try {
      const [sumRes, statRes] = await Promise.allSettled([
        api.getThreatIntelSummary(),
        typeof api.getIntelligenceStatus === 'function' ? api.getIntelligenceStatus() : Promise.resolve(null),
      ]);
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
      if (statRes.status === 'fulfilled' && statRes.value) setIntelStatus(statRes.value);
    } catch (err) {
      console.error('Failed to load threat intel summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (typeof api.syncThreatIntel !== 'function') return;
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      await api.syncThreatIntel(true);
      setSyncMessage('Threat Intelligence background sync triggered.');
      setTimeout(() => {
        loadSummary();
        executeMitreSearch(mitreQuery, selectedTactic);
        executeVulnSearch(vulnQuery, selectedVendor, ransomwareOnly);
      }, 2000);
    } catch (err: any) {
      setSyncMessage(`Sync failed: ${err.message || 'Offline'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const executeMitreSearch = async (q: string, tactic: string) => {
    if (typeof api.searchMitreTechniques !== 'function') return;
    setIsMitreLoading(true);
    try {
      const data = await api.searchMitreTechniques({
        q: q || undefined,
        tactic: tactic || undefined,
        limit: 30,
      });
      setMitreResults(data.results || []);
      setMitreTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to search MITRE techniques:', err);
    } finally {
      setIsMitreLoading(false);
    }
  };

  const executeVulnSearch = async (q: string, vendor: string, rwOnly: boolean) => {
    if (typeof api.searchCisaKev !== 'function') return;
    setIsVulnLoading(true);
    try {
      const data = await api.searchCisaKev({
        q: q || undefined,
        vendor: vendor || undefined,
        ransomware_only: rwOnly,
        limit: 30,
      });
      setVulnResults(data.results || []);
      setVulnTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to search CISA KEV & NVD:', err);
    } finally {
      setIsVulnLoading(false);
    }
  };

  const loadAssetVulnerabilities = async (assetId: string) => {
    if (typeof api.getAssetVulnerabilityEnrichment !== 'function') return;
    setIsAssetLoading(true);
    try {
      const data = await api.getAssetVulnerabilityEnrichment(assetId);
      setAssetEnrichment(data);
    } catch (err) {
      console.error(`Failed to load asset vulnerability enrichment for ${assetId}:`, err);
      setAssetEnrichment(null);
    } finally {
      setIsAssetLoading(false);
    }
  };

  const handleGenerateAiExplanation = async () => {
    if (typeof api.explainIncident !== 'function') return;
    setIsAiLoading(true);
    try {
      const res = await api.explainIncident({
        threat_category: aiCategory,
        affected_asset: aiAsset,
        target_crown_jewel: 'db-prod-01',
        technique_ids: ['T1190', 'T1021.004'],
        cve_ids: ['CVE-2023-3519'],
        recommended_action: 'ISOLATE_WORKSTATION',
      });
      setAiExplanation(res);
    } catch (err) {
      console.error('AI explanation failed:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const tacticOptions = [
    { label: 'All Tactics', val: '' },
    { label: 'Initial Access', val: 'initial-access' },
    { label: 'Execution', val: 'execution' },
    { label: 'Persistence', val: 'persistence' },
    { label: 'Privilege Escalation', val: 'privilege-escalation' },
    { label: 'Defense Evasion', val: 'defense-evasion' },
    { label: 'Credential Access', val: 'credential-access' },
    { label: 'Discovery', val: 'discovery' },
    { label: 'Lateral Movement', val: 'lateral-movement' },
    { label: 'Command & Control', val: 'command-and-control' },
    { label: 'Impact', val: 'impact' },
  ];

  const vendorOptions = ['', 'Microsoft', 'Citrix', 'Cisco', 'Fortinet', 'Apple', 'Linux', 'Google'];

  const sampleAssets = [
    { id: 'gw-ext-01', name: 'Edge Gateway Router (CVE-2023-3519)' },
    { id: 'srv-web-01', name: 'Public Portal App Server (CVE-2024-21413)' },
    { id: 'fw-dmz-01', name: 'NextGen DMZ Firewall (No CVEs)' },
    { id: 'ws-admin-01', name: 'Tier-1 Domain Admin Workstation' },
    { id: 'db-prod-01', name: 'Production SQL Crown Jewel' },
  ];

  const epssCount = intelStatus?.summary_counts?.epss_scores || 395308;
  const rwCount = intelStatus?.summary_counts?.known_ransomware_associated || summary?.cisa_kev?.known_ransomware_associated || 361;

  return (
    <div className="w-full bg-[#0a0a0c] border border-[#1f2227] rounded-xl overflow-hidden shadow-2xl">
      {/* Top OS Header */}
      <div className="p-6 border-b border-[#1f2227] bg-[#0f1013]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-[#F02D46] shadow-[0_0_10px_#F02D46]" />
            <h2 className="font-heading text-xl font-bold tracking-wider text-white">
              THREAT INTELLIGENCE MATRIX
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase bg-[#F02D46]/20 text-[#F02D46] border border-[#F02D46]/40">
              OFFLINE READY
            </span>
          </div>
          <p className="text-xs font-mono text-gray-400 mt-1">
            MITRE ATT&CK® STIX • CISA KEV CATALOG • FIRST EPSS PROBABILITIES • NVD CVSS METRICS
          </p>
        </div>

        {/* Sync Controls & Telemetry */}
        <div className="flex items-center gap-3">
          {summary?.last_synced_utc && (
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-mono text-gray-500 block uppercase">Intelligence Freshness</span>
              <span className="text-xs font-mono text-gray-300">
                {new Date(summary.last_synced_utc).toLocaleDateString()}
              </span>
            </div>
          )}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-[#14151a] hover:bg-[#1a1c24] border border-[#262a33] text-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#F02D46] ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Feeds'}
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="px-6 py-2 bg-[#F02D46]/10 border-b border-[#F02D46]/30 text-xs font-mono text-[#F02D46] flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          {syncMessage}
        </div>
      )}

      {/* 5-Column Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-[#1f2227] border-b border-[#1f2227]">
        <div className="p-4 bg-[#0d0e12]">
          <div className="text-[10px] font-mono uppercase text-gray-500 tracking-wider">MITRE Techniques</div>
          <div className="text-xl font-mono font-bold text-white mt-1">
            {summary?.mitre_attack?.total_techniques || 706}
          </div>
          <div className="text-[10px] font-mono text-gray-400 mt-0.5">Enterprise STIX 2.1</div>
        </div>

        <div className="p-4 bg-[#0d0e12]">
          <div className="text-[10px] font-mono uppercase text-gray-500 tracking-wider">CISA KEV Catalog</div>
          <div className="text-xl font-mono font-bold text-white mt-1">
            {summary?.cisa_kev?.total_vulnerabilities || 1756}
          </div>
          <div className="text-[10px] font-mono text-gray-400 mt-0.5">Known Exploited in Wild</div>
        </div>

        <div className="p-4 bg-[#0d0e12]">
          <div className="text-[10px] font-mono uppercase text-gray-500 tracking-wider">FIRST EPSS Scores</div>
          <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
            {Number(epssCount).toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-gray-400 mt-0.5">30-Day Probability Engine</div>
        </div>

        <div className="p-4 bg-[#0d0e12]">
          <div className="text-[10px] font-mono uppercase text-gray-500 tracking-wider">Ransomware Exploited</div>
          <div className="text-xl font-mono font-bold text-[#F02D46] mt-1">
            {rwCount}
          </div>
          <div className="text-[10px] font-mono text-gray-400 mt-0.5">Active Threat Campaigns</div>
        </div>

        <div className="p-4 bg-[#0d0e12] col-span-2 md:col-span-1">
          <div className="text-[10px] font-mono uppercase text-gray-500 tracking-wider">Licensing & Terms</div>
          <div className="text-xs font-mono text-gray-300 mt-1.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Apache 2.0 / CC0</span>
          </div>
          <div className="text-[10px] font-mono text-gray-500 mt-0.5">100% Offline Ready</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 border-b border-[#1f2227] bg-[#0c0d10] flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('mitre')}
          className={`py-3 px-4 text-xs font-mono uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'mitre'
              ? 'border-[#F02D46] text-white font-bold bg-[#14151b]'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#F02D46]" />
          MITRE ATT&CK Matrix ({mitreTotal})
        </button>

        <button
          onClick={() => setActiveTab('vulnerabilities')}
          className={`py-3 px-4 text-xs font-mono uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'vulnerabilities'
              ? 'border-[#F02D46] text-white font-bold bg-[#14151b]'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-[#F02D46]" />
          Vulnerabilities (KEV & EPSS) ({vulnTotal})
        </button>

        <button
          onClick={() => setActiveTab('assets')}
          className={`py-3 px-4 text-xs font-mono uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'assets'
              ? 'border-[#F02D46] text-white font-bold bg-[#14151b]'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Server className="w-3.5 h-3.5 text-[#F02D46]" />
          Asset CVE Correlation
        </button>

        <button
          onClick={() => {
            setActiveTab('ai');
            if (!aiExplanation) handleGenerateAiExplanation();
          }}
          className={`py-3 px-4 text-xs font-mono uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'ai'
              ? 'border-[#F02D46] text-white font-bold bg-[#14151b]'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-[#F02D46]" />
          AI Incident Briefing (Ollama)
        </button>
      </div>

      {/* Tab 1: MITRE ATT&CK Explorer */}
      {activeTab === 'mitre' && (
        <div className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search technique ID (e.g. T1190, T1021.004) or keyword..."
                value={mitreQuery}
                onChange={(e) => {
                  setMitreQuery(e.target.value);
                  executeMitreSearch(e.target.value, selectedTactic);
                }}
                className="w-full bg-[#111317] border border-[#232730] pl-10 pr-4 py-2 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-[#F02D46]"
              />
            </div>

            <div className="sm:w-64">
              <select
                value={selectedTactic}
                onChange={(e) => {
                  setSelectedTactic(e.target.value);
                  executeMitreSearch(mitreQuery, e.target.value);
                }}
                className="w-full bg-[#111317] border border-[#232730] px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-[#F02D46]"
              >
                {tacticOptions.map((opt) => (
                  <option key={opt.val} value={opt.val}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isMitreLoading ? (
            <div className="py-12 text-center text-xs font-mono text-gray-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#F02D46]" />
              Querying local MITRE ATT&CK STIX database...
            </div>
          ) : mitreResults.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#232730] text-xs font-mono text-gray-500">
              No techniques matched the query "{mitreQuery}".
            </div>
          ) : (
            <div className="space-y-3">
              {mitreResults.map((tech) => {
                const isExpanded = expandedTechniqueId === tech.id;
                return (
                  <div
                    key={tech.id}
                    className="p-4 bg-[#0d0e12] border border-[#1f2227] hover:border-[#333742] transition-colors rounded"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-xs font-mono font-bold text-[#F02D46] bg-[#F02D46]/10 border border-[#F02D46]/30">
                            {tech.id}
                          </span>
                          <h4 className="text-sm font-heading font-bold text-white tracking-wide">
                            {tech.name}
                          </h4>
                          {tech.is_subtechnique && (
                            <span className="text-[10px] font-mono text-gray-500 uppercase">Sub-technique</span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {tech.tactics.map((tac) => (
                            <span
                              key={tac}
                              className="px-1.5 py-0.5 text-[10px] font-mono text-gray-300 bg-[#161820] border border-[#282c37]"
                            >
                              {tac.replace('-', ' ').toUpperCase()}
                            </span>
                          ))}
                          {tech.platforms.map((plat) => (
                            <span key={plat} className="text-[10px] font-mono text-gray-500">
                              [{plat}]
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedTechniqueId(isExpanded ? null : tech.id)}
                          className="px-2.5 py-1 text-[11px] font-mono uppercase bg-[#14161c] hover:bg-[#1a1d26] text-gray-300 border border-[#242730]"
                        >
                          {isExpanded ? 'Collapse' : 'Details'}
                        </button>
                        <a
                          href={tech.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-gray-400 hover:text-[#F02D46] hover:bg-[#F02D46]/10 border border-[#242730]"
                          title="Open official MITRE page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-[#1f2227] space-y-3">
                        <div className="text-xs text-gray-300 leading-relaxed font-sans">
                          {tech.description}
                        </div>
                        {tech.detection && (
                          <div className="p-3 bg-[#111317] border border-[#232730] text-xs font-mono text-gray-400">
                            <span className="text-[#F02D46] font-bold block mb-1">DETECTION STRATEGY</span>
                            {tech.detection}
                          </div>
                        )}
                        <div className="text-[10px] font-mono text-gray-500">
                          Source: MITRE ATT&CK® Enterprise STIX 2.1 Repository
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Unified Vulnerabilities (CISA KEV + EPSS + NVD) */}
      {activeTab === 'vulnerabilities' && (
        <div className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search CVE ID (e.g. CVE-2023-3519) or product/keyword..."
                value={vulnQuery}
                onChange={(e) => {
                  setVulnQuery(e.target.value);
                  executeVulnSearch(e.target.value, selectedVendor, ransomwareOnly);
                }}
                className="w-full bg-[#111317] border border-[#232730] pl-10 pr-4 py-2 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-[#F02D46]"
              />
            </div>

            <div className="sm:w-48">
              <select
                value={selectedVendor}
                onChange={(e) => {
                  setSelectedVendor(e.target.value);
                  executeVulnSearch(vulnQuery, e.target.value, ransomwareOnly);
                }}
                className="w-full bg-[#111317] border border-[#232730] px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-[#F02D46]"
              >
                <option value="">All Vendors</option>
                {vendorOptions.filter(Boolean).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                const toggled = !ransomwareOnly;
                setRansomwareOnly(toggled);
                executeVulnSearch(vulnQuery, selectedVendor, toggled);
              }}
              className={`px-3 py-2 text-xs font-mono uppercase tracking-wider border flex items-center gap-2 transition-colors ${
                ransomwareOnly
                  ? 'bg-[#F02D46]/20 border-[#F02D46] text-[#F02D46]'
                  : 'bg-[#111317] border-[#232730] text-gray-400 hover:text-gray-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Ransomware Only
            </button>
          </div>

          {isVulnLoading ? (
            <div className="py-12 text-center text-xs font-mono text-gray-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#F02D46]" />
              Querying CISA KEV & NVD vulnerability database...
            </div>
          ) : vulnResults.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#232730] text-xs font-mono text-gray-500">
              No vulnerabilities matched the query "{vulnQuery}".
            </div>
          ) : (
            <div className="space-y-3">
              {vulnResults.map((v) => {
                const isExpanded = expandedCveId === v.cveID;
                const isRansomware = (v.knownRansomwareCampaignUse || '').toLowerCase() === 'known';
                return (
                  <div
                    key={v.cveID}
                    className="p-4 bg-[#0d0e12] border border-[#1f2227] hover:border-[#333742] transition-colors rounded"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 text-xs font-mono font-bold text-white bg-[#14161d] border border-[#2b303c]">
                            {v.cveID}
                          </span>
                          <span className="text-xs font-mono font-bold text-[#F02D46]">
                            {v.vendorProject} — {v.product}
                          </span>
                          {/* KEV Flag */}
                          <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            CISA KEV
                          </span>
                          {/* Ransomware Flag */}
                          {isRansomware && (
                            <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-[#F02D46]/20 text-[#F02D46] border border-[#F02D46]/40">
                              Ransomware
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-sans text-gray-300 font-medium pt-0.5">
                          {v.vulnerabilityName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-gray-500">
                          <span>Added to KEV: {v.dateAdded}</span>
                          {v.dueDate && <span>Mitigation Due: {v.dueDate}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedCveId(isExpanded ? null : v.cveID)}
                          className="px-2.5 py-1 text-[11px] font-mono uppercase bg-[#14161c] hover:bg-[#1a1d26] text-gray-300 border border-[#242730]"
                        >
                          {isExpanded ? 'Collapse' : 'Remediation'}
                        </button>
                        <a
                          href={`https://nvd.nist.gov/vuln/detail/${v.cveID}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-gray-400 hover:text-[#F02D46] hover:bg-[#F02D46]/10 border border-[#242730]"
                          title="View on NVD NIST"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-[#1f2227] space-y-3">
                        <div className="text-xs text-gray-300 leading-relaxed font-sans">
                          {v.shortDescription}
                        </div>
                        <div className="p-3 bg-[#111317] border border-[#232730] space-y-1">
                          <span className="text-emerald-400 font-mono text-xs font-bold block">
                            CISA MANDATED MITIGATION ACTION
                          </span>
                          <p className="text-xs font-mono text-gray-300">{v.requiredAction}</p>
                        </div>
                        {v.notes && (
                          <div className="text-[10px] font-mono text-gray-500 break-all">
                            Advisories: {v.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Asset Correlation Workbench */}
      {activeTab === 'assets' && (
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#0d0e12] border border-[#1f2227]">
            <div>
              <span className="text-[10px] font-mono uppercase text-gray-500 block">Select Network Asset</span>
              <span className="text-xs font-mono text-gray-300">
                Correlate asset vulnerability records strictly against CISA KEV and EPSS evidence
              </span>
            </div>
            <select
              value={selectedAssetId}
              onChange={(e) => {
                setSelectedAssetId(e.target.value);
                loadAssetVulnerabilities(e.target.value);
              }}
              className="bg-[#14161c] border border-[#252833] px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#F02D46]"
            >
              {sampleAssets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.name}
                </option>
              ))}
            </select>
          </div>

          {isAssetLoading ? (
            <div className="py-12 text-center text-xs font-mono text-gray-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#F02D46]" />
              Correlating asset vulnerabilities with CISA KEV and EPSS...
            </div>
          ) : !assetEnrichment ? (
            <div className="p-8 text-center text-xs font-mono text-gray-500">Asset not found.</div>
          ) : assetEnrichment.matches.length === 0 ? (
            <div className="p-8 border border-dashed border-[#232730] text-center space-y-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <div className="text-sm font-heading font-bold text-white">No Documented CVEs Found</div>
              <p className="text-xs font-mono text-gray-400 max-w-md mx-auto">
                Asset <span className="text-[#F02D46]">{assetEnrichment.asset_id}</span> has no explicit CVE records
                in enterprise topology. ØMEN does not synthesize unverified vulnerability claims without evidence.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                  Verified Matches ({assetEnrichment.matches.length})
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/30">
                  {assetEnrichment.cisa_kev_matches_count} Cataloged in CISA KEV
                </span>
              </div>

              {assetEnrichment.matches.map((m) => (
                <div
                  key={m.cve_id}
                  className="p-5 bg-[#0d0e12] border border-[#1f2227] space-y-3 rounded"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-xs font-mono font-bold bg-[#F02D46]/10 text-[#F02D46] border border-[#F02D46]/30">
                        {m.cve_id}
                      </span>
                      {m.in_cisa_kev ? (
                        <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          CISA KEV Confirmed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-800">
                          Non-Cataloged CVE
                        </span>
                      )}
                    </div>
                    <a
                      href={m.nvd_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono text-gray-400 hover:text-[#F02D46] flex items-center gap-1.5"
                    >
                      <span>NVD Details</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {m.in_cisa_kev && (
                    <>
                      <div>
                        <h4 className="text-sm font-heading font-bold text-white">{m.vulnerability_name}</h4>
                        <p className="text-xs text-gray-300 font-sans mt-1 leading-relaxed">
                          {m.short_description}
                        </p>
                      </div>

                      <div className="p-3 bg-[#111317] border border-[#232730] space-y-1">
                        <span className="text-emerald-400 font-mono text-xs font-bold block">
                          MANDATED REMEDIATION ACTION
                        </span>
                        <p className="text-xs font-mono text-gray-300">{m.required_action}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-gray-500 pt-1">
                        <span>Vendor: {m.vendor_project}</span>
                        <span>Product: {m.product}</span>
                        <span>Added: {m.date_added}</span>
                        <span>Due Date: {m.due_date || 'N/A'}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Local AI Incident Briefing (Ollama Assistant) */}
      {activeTab === 'ai' && (
        <div className="p-6 space-y-6">
          <div className="p-5 bg-[#0d0e12] border border-[#1f2227] rounded space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#F02D46]" />
                  <h3 className="text-sm font-heading font-bold text-white tracking-wide">
                    AUTONOMOUS INCIDENT EXPLANATION ASSISTANT
                  </h3>
                </div>
                <p className="text-xs font-mono text-gray-400 mt-1">
                  Synthesizes Neural Threat Detection, MITRE ATT&CK, CISA KEV, and zero-trust containment rationale.
                </p>
              </div>

              <button
                onClick={handleGenerateAiExplanation}
                disabled={isAiLoading}
                className="flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider bg-[#F02D46] hover:bg-[#d0243a] text-white font-bold transition-colors disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
                {isAiLoading ? 'Analyzing...' : 'Generate AI Briefing'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">Threat Category</label>
                <select
                  value={aiCategory}
                  onChange={(e) => setAiCategory(e.target.value)}
                  className="w-full bg-[#111317] border border-[#232730] px-3 py-2 text-xs font-mono text-white"
                >
                  <option value="Exploitation">Exploitation / Initial Foothold</option>
                  <option value="Lateral Movement">Lateral Movement Pivot</option>
                  <option value="Privilege Escalation">Domain Privilege Escalation</option>
                  <option value="Credential Access">Credential Dumping / Kerberoasting</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">Target Asset</label>
                <select
                  value={aiAsset}
                  onChange={(e) => setAiAsset(e.target.value)}
                  className="w-full bg-[#111317] border border-[#232730] px-3 py-2 text-xs font-mono text-white"
                >
                  <option value="srv-web-01">srv-web-01 (DMZ Public Portal)</option>
                  <option value="gw-ext-01">gw-ext-01 (Citrix NetScaler Gateway)</option>
                  <option value="ws-admin-01">ws-admin-01 (Tier-1 Admin Workstation)</option>
                  <option value="dc-01">dc-01 (Domain Controller)</option>
                </select>
              </div>
            </div>
          </div>

          {aiExplanation && (
            <div className="p-6 bg-[#0e1014] border border-[#282d37] space-y-4 rounded-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f2227] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    {aiExplanation.generator === 'local_ollama' ? 'Local Ollama LLM Briefing' : 'Deterministic Technical Briefing'}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">[{aiExplanation.model}]</span>
                </div>
                <span className="text-[10px] font-mono text-gray-500">100% Private Local Inference</span>
              </div>

              <div className="space-y-3">
                <div className="text-xs text-gray-200 font-sans leading-relaxed">
                  <span className="font-mono text-[#F02D46] font-bold block mb-1">INCIDENT EXECUTIVE SUMMARY</span>
                  {aiExplanation.summary}
                </div>

                <div className="p-3 bg-[#13151b] border border-[#20242e] text-xs font-mono text-gray-300">
                  <span className="text-white font-bold block mb-1">TACTICAL MITRE ADVERSARY MAPPING</span>
                  {aiExplanation.tactical_analysis}
                </div>

                <div className="p-3 bg-[#13151b] border border-[#20242e] text-xs font-mono text-gray-300">
                  <span className="text-white font-bold block mb-1">VULNERABILITY & EXPLOITATION CONTEXT</span>
                  {aiExplanation.vulnerability_context}
                </div>

                <div className="p-3 bg-[#13151b] border border-[#20242e] text-xs font-mono text-emerald-400">
                  <span className="font-bold block mb-1 text-white">CONTAINMENT DECISION RATIONALE</span>
                  {aiExplanation.containment_rationale}
                </div>

                <div className="text-[10px] font-mono text-gray-500 italic">
                  {aiExplanation.disclaimer}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attribution Footer */}
      <div className="p-4 bg-[#0a0a0d] border-t border-[#1f2227] flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-gray-500">
        <div>
          <span>Attribution: © 2025 MITRE (Apache 2.0) • CISA KEV (CC0) • FIRST.Org EPSS • NIST NVD</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="https://attack.mitre.org" target="_blank" rel="noreferrer" className="hover:text-[#F02D46]">
            attack.mitre.org
          </a>
          <span>•</span>
          <a href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog" target="_blank" rel="noreferrer" className="hover:text-[#F02D46]">
            cisa.gov/kev
          </a>
          <span>•</span>
          <a href="https://www.first.org/epss/" target="_blank" rel="noreferrer" className="hover:text-[#F02D46]">
            first.org/epss
          </a>
        </div>
      </div>
    </div>
  );
};
