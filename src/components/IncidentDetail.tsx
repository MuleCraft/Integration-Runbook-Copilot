import type { Incident, Runbook } from '../types';
import { Activity, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { getIncidentSeverityLabel } from '../utils/severity';
import { renderBulletPoints } from '../utils/textFormat';

interface IncidentDetailsProps {
    incident: Incident;
    runbook: Runbook;
    isTopIncident: boolean;
}

export function IncidentDetails({ incident }: IncidentDetailsProps) {
    const getSeverityStyles = (sev: string) => {
        const normalized = sev.toLowerCase();
        switch (normalized) {
            case 'p1':
            case 'high':
            case 'critical':
                return { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' };
            case 'p2':
            case 'medium':
                return { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' };
            case 'p3':
            case 'p4':
            case 'low':
                return { text: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' };
            default:
                return { text: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', border: 'rgba(100, 116, 139, 0.2)' };
        }
    };

    // Use AI recommended severity if available, otherwise fallback to parsed severity
    const displaySeverity = getIncidentSeverityLabel(incident);

    const styles = getSeverityStyles(displaySeverity);

    // Clean raw content specifically for JSON display if needed, but not primarily used now

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-y-auto">
            {/* Header Section */}
            {/* Header Section */}
            <div className="p-5 bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="flex flex-col gap-3 items-start">
                        <div className="flex items-center gap-2">
                            <span
                                className="px-2.5 py-1 rounded-md text-[10px] font-black border shadow-sm uppercase tracking-wide"
                                style={{ backgroundColor: styles.bg, color: styles.text, borderColor: styles.border }}
                            >
                                {displaySeverity}
                            </span>
                            {incident.environment && (
                                <span className="px-2 py-1 rounded bg-orange-50 border border-orange-100 text-[10px] font-bold text-orange-600 uppercase tracking-wide">
                                    {incident.environment}
                                </span>
                            )}
                            {incident.object && (
                                <span className="px-2 py-1 rounded bg-purple-50 border border-purple-100 text-[10px] font-bold text-purple-600 uppercase tracking-wide">
                                    {incident.object}
                                </span>
                            )}
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight truncate w-full">
                            {incident.service} {incident.appName && <span className="text-slate-500">({incident.appName})</span>}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="p-5 max-w-7xl mx-auto w-full space-y-5">
                {/* Main Grid: AI Health & Original Content */}
                <div className="grid grid-cols-12 gap-8 items-start">

                    {/* Left Column: AI Health Intelligence (5 columns, Vertical Stack) */}
                    <div className="col-span-12 lg:col-span-5 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="text-blue-600" size={18} />
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">AI Health Intelligence</h3>
                        </div>

                        {incident.observabilityData ? (
                            <div className="flex flex-col gap-8">
                                {/* Status Section */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={clsx(
                                            "w-3 h-3 rounded-full",
                                            (incident.observabilityData.status?.toLowerCase().includes('up') ||
                                                incident.observabilityData.status?.toLowerCase().includes('healthy'))
                                                ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                                        )} />
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Live Status</span>
                                    </div>
                                    <div className="text-sm font-medium text-slate-800 leading-relaxed">
                                        {incident.aiHealthSummary?.statusSection ? renderBulletPoints(incident.aiHealthSummary.statusSection) : <p>{incident.observabilityData.status}</p>}
                                    </div>
                                </div>

                                {/* Deployment Section */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Clock size={16} className="text-blue-500" />
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Deployment</span>
                                    </div>
                                    <div className="mb-3">
                                        <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-600 text-[11px] font-bold border border-blue-100">
                                            {incident.observabilityData.version}
                                        </span>
                                    </div>
                                    <div className="text-sm font-medium text-slate-600 leading-relaxed">
                                        {incident.aiHealthSummary?.deploymentSection ? renderBulletPoints(incident.aiHealthSummary.deploymentSection) : <p>{incident.observabilityData.changeSummary}</p>}
                                    </div>
                                </div>

                                {/* Smoke Section */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <ShieldCheck size={16} className={clsx(
                                            (incident.observabilityData.smoke?.toLowerCase().includes('success') ||
                                                incident.observabilityData.smoke?.toLowerCase().includes('passed'))
                                                ? "text-emerald-500" : "text-amber-500"
                                        )} />
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Smoke Validation</span>
                                    </div>
                                    <div className="text-sm font-medium text-slate-700 leading-relaxed">
                                        {incident.aiHealthSummary?.smokeSection ? renderBulletPoints(incident.aiHealthSummary.smokeSection) : <p>{incident.observabilityData.smoke}</p>}
                                    </div>
                                </div>

                                {/* AI Verdict */}
                                {incident.aiHealthSummary?.conclusion && (
                                    <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex items-start gap-4 mt-2">
                                        <div className="p-2 bg-white rounded-xl shadow-sm">
                                            <Activity size={20} className="text-indigo-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Operational Verdict</h4>
                                                {incident.aiHealthSummary.recommendedSeverity && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 uppercase">
                                                        Rec: {incident.aiHealthSummary.recommendedSeverity}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm font-bold text-indigo-900 leading-relaxed">
                                                {incident.aiHealthSummary.conclusion}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-10 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
                                <span className="text-sm text-gray-400 font-medium">No observability data available</span>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Original Content (7 columns) - NO HEADER, FULL HEIGHT */}
                    {/* Right Column: Original Content (7 columns) - NO HEADER, FULL HEIGHT */}
                    <div className="col-span-12 lg:col-span-7">
                        <div className="bg-transparent max-w-2xl mx-auto">
                            <div className="prose prose-xs max-w-none text-slate-600 prose-headings:text-slate-800 prose-p:text-slate-600 prose-a:text-blue-600">
                                {incident.rawContent ? (
                                    /<[a-z][\s\S]*>/i.test(incident.rawContent) ? (
                                        <div
                                            className="reset-styles"
                                            dangerouslySetInnerHTML={{ __html: incident.rawContent }}
                                            style={{ transform: 'scale(0.95)', transformOrigin: 'top left' }}
                                        />
                                    ) : (
                                        <pre className="whitespace-pre-wrap font-mono text-[10px] text-slate-600 leading-tight">
                                            {incident.rawContent}
                                        </pre>
                                    )
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-10 text-slate-400">
                                        <p className="text-xs font-medium">No content preview available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
