import React from 'react';
import { OmenSectionHeader } from '../components/ui/OmenSectionHeader';
import { ModuleThreatIntelPanel } from '../components/dashboard/ModuleThreatIntelPanel';
import { ShieldAlert, BookOpen, ExternalLink, GitPullRequest } from 'lucide-react';

export const ThreatIntel: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <OmenSectionHeader
        tag="GLOBAL THREAT INTELLIGENCE"
        moduleNumber="INTEL"
        title="THREAT INTELLIGENCE MATRIX"
        subtitle="OFFICIAL MITRE ATT&CK® STIX REPOSITORY & CISA KNOWN EXPLOITED VULNERABILITIES (KEV)"
      />

      {/* Main Threat Intel Panel */}
      <ModuleThreatIntelPanel />

      {/* Technical Provenance & Attribution Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-[#0d0e12] border border-[#1f2227] rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#F02D46]" />
            <h4 className="text-sm font-heading font-bold text-white tracking-wide">
              MITRE ATT&CK® ENTERPRISE STIX
            </h4>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed font-sans">
            Provides a curated knowledge base of cyber adversary behavior based on real-world observations.
            ØMEN integrates the enterprise STIX JSON specification directly to map lateral movement corridors,
            privilege escalation hops, and detection strategies without relying on external SaaS APIs.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a
              href="https://github.com/mitre-attack/attack-stix-data"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-gray-300 hover:text-[#F02D46] flex items-center gap-1.5 transition-colors"
            >
              <GitPullRequest className="w-3.5 h-3.5 text-[#F02D46]" />
              <span>attack-stix-data Repo</span>
              <ExternalLink className="w-3 h-3 text-gray-500" />
            </a>
          </div>
        </div>

        <div className="p-5 bg-[#0d0e12] border border-[#1f2227] rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#F02D46]" />
            <h4 className="text-sm font-heading font-bold text-white tracking-wide">
              CISA KNOWN EXPLOITED VULNERABILITIES (KEV)
            </h4>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed font-sans">
            The authoritative catalog of vulnerabilities actively exploited in the wild, published by the
            Cybersecurity and Infrastructure Security Agency (CISA). ØMEN evaluates candidate assets against
            these CVEs to enforce deterministic zero-trust containment and mandated remediation timelines.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a
              href="https://github.com/cisagov/kev-data"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-gray-300 hover:text-[#F02D46] flex items-center gap-1.5 transition-colors"
            >
              <GitPullRequest className="w-3.5 h-3.5 text-[#F02D46]" />
              <span>kev-data Repo</span>
              <ExternalLink className="w-3 h-3 text-gray-500" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreatIntel;
