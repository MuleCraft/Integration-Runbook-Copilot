
import type { Incident } from '../types';
import { Clock, Server, Shield, Activity, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { getIncidentSeverityLabel } from '../utils/severity';

interface IncidentGridProps {
    incidents: Incident[];
    onSelect: (id: string) => void;
    loading: boolean;
}

export function IncidentGrid({ incidents, onSelect, loading }: IncidentGridProps) {
    if (loading) return null;

    if (incidents.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Activity size={32} className="opacity-40" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Alerts Found</h3>
                <p className="text-sm max-w-sm text-center">
                    Adjust your filters or analyze new alerts to see results here.
                </p>
            </div>
        );
    }

    const getSeverityStyles = (severity: string) => {
        const normalized = severity.toLowerCase();
        switch (normalized) {
            case 'p1':
            case 'high':
            case 'critical':
                return 'bg-red-50 text-red-700 border-red-100';
            case 'p2':
            case 'medium':
                return 'bg-orange-50 text-orange-700 border-orange-100';
            case 'p3':
            case 'p4':
            case 'low':
                return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            <div className="px-8 py-6 flex justify-between items-center bg-white border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <Activity className="text-amber-600" size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Filtered Intelligence</h2>
                        <p className="text-xs text-gray-500 font-medium">Real-time alert categorization & AI analysis</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs font-bold text-gray-600">
                    {incidents.length} Alerts Found
                </div>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {incidents.map((incident) => (
                        <div
                            key={incident.id}
                            onClick={() => onSelect(incident.id)}
                            className="group bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col h-full"
                        >
                            <div className="flex justify-between items-start mb-4">
                                {/* Use AI recommended severity if available */}
                                {(() => {
                                    const displaySeverity = getIncidentSeverityLabel(incident);
                                    return (
                                        <span className={clsx(
                                            "px-2 py-1 rounded text-xs font-bold border",
                                            getSeverityStyles(displaySeverity)
                                        )}>
                                            {displaySeverity}
                                        </span>
                                    );
                                })()}
                                <div className="flex items-center gap-1.5 text-gray-500 text-xs text-right">
                                    <Clock size={12} />
                                    {new Date(incident.timestamp).toLocaleString([], {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>

                            <h3 className="font-extrabold text-slate-900 mb-2 line-clamp-2 min-h-[3rem] text-sm leading-relaxed">
                                {incident.service}
                            </h3>

                            <div className="mt-auto pt-4 flex flex-col gap-2 border-t border-slate-50">
                                <div className="flex items-center gap-2 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg w-fit">
                                    <Server size={12} />
                                    <span className="truncate uppercase tracking-wider">{incident.appName || 'Unknown API'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium ml-1">
                                    <Shield size={12} className="text-slate-400" />
                                    <span>{incident.environment || 'Production'}</span>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-between items-center text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                View AI Analysis
                                <ChevronRight size={14} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
