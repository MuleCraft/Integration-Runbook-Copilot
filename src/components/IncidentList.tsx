
import type { Incident } from '../types';
import { Activity, Play, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { getIncidentSeverityLabel } from '../utils/severity';

interface IncidentListProps {
    incidents: Incident[];
    selectedFilters: {
        applications: string[];
        environments: string[];
        importance: string[];
        timestamps: string[];
    };
    onFilterChange: (filters: any) => void;
    onAnalyze: () => void;
    loading: boolean;
}

export function IncidentList({
    incidents,
    selectedFilters,
    onFilterChange,
    onAnalyze,
    loading
}: IncidentListProps) {
    const [expandedSections, setExpandedSections] = useState<string[]>(['applications', 'messages', 'environments', 'severity', 'timestamps']);

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    };

    const toggleFilter = (category: string, value: string) => {
        const current = (selectedFilters as any)[category] as string[];
        const updated = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];

        onFilterChange({
            ...selectedFilters,
            [category]: updated
        });
    };

    // Extract unique values for filters
    const applications = Array.from(new Set(incidents.map(i => i.appName || 'Unknown API'))).sort();
    const alertMessages = Array.from(new Set(incidents.map(i => i.service))).sort();
    const environments = Array.from(new Set(incidents.map(i => i.environment || 'Unspecified'))).sort();
    const timestamps = Array.from(new Set(incidents.map(i => new Date(i.timestamp).toLocaleDateString()))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const FilterSection = ({ title, id, items, category }: { title: string, id: string, items: string[], category: string }) => {
        const isExpanded = expandedSections.includes(id);
        const selectedItems = (selectedFilters as any)[category] as string[] || [];

        return (
            <div className="border-b border-gray-100 last:border-0">
                <button
                    onClick={() => toggleSection(id)}
                    className="w-full py-3 flex items-center justify-between text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors"
                >
                    <span className="flex items-center gap-2 px-6">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {title}
                        {selectedItems.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px]">
                                {selectedItems.length}
                            </span>
                        )}
                    </span>
                </button>
                {isExpanded && (
                    <div className="pb-3 space-y-1">
                        {items.length === 0 ? (
                            <p className="px-6 py-2 text-xs text-gray-400 italic">No options available</p>
                        ) : (
                            items.map(item => (
                                <label
                                    key={item}
                                    className="flex items-center gap-3 px-6 py-1.5 hover:bg-gray-50 cursor-pointer transition-colors group"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.includes(item)}
                                        onChange={() => toggleFilter(category, item)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                                    />
                                    <span className={clsx(
                                        "text-sm transition-colors line-clamp-1",
                                        selectedItems.includes(item) ? "text-blue-600 font-medium" : "text-gray-600 group-hover:text-gray-900"
                                    )}>
                                        {item}
                                    </span>
                                </label>
                            ))
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="p-6 border-b border-gray-100">
                <button
                    onClick={onAnalyze}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] mb-4"
                >
                    {loading ? <Activity className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
                    {loading ? 'Analyzing...' : 'Analyze Latest Alerts'}
                </button>

                <div className="px-1 text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">
                    Filters
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <FilterSection
                    title="Applications"
                    id="applications"
                    items={applications}
                    category="applications"
                />
                <FilterSection
                    title="Alert Messages"
                    id="messages"
                    items={alertMessages}
                    category="messages"
                />
                <FilterSection
                    title="Environments"
                    id="environments"
                    items={environments}
                    category="environments"
                />
                <FilterSection
                    title="Severity"
                    id="severity"
                    items={Array.from(new Set(incidents.map(i => getIncidentSeverityLabel(i)))).sort()}
                    category="importance"
                />
                <FilterSection
                    title="Timestamp"
                    id="timestamps"
                    items={timestamps}
                    category="timestamps"
                />
            </div>

            {Object.values(selectedFilters).some(arr => arr.length > 0) && (
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <button
                        onClick={() => onFilterChange({
                            applications: [],
                            messages: [],
                            environments: [],
                            importance: [],
                            timestamps: []
                        })}
                        className="w-full py-2 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors text-center"
                    >
                        Clear All Filters
                    </button>
                </div>
            )}

        </div>
    );
}
