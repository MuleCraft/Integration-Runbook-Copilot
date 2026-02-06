import { useState } from 'react';
import { Header } from './components/Header';
import { IncidentList } from './components/IncidentList';
import { IncidentDetails } from './components/IncidentDetail';
import { IncidentGrid } from './components/IncidentGrid';
import { AnalysisDialog } from './components/AnalysisDialog';
import type { Incident, Runbook, IncidentAnalysisResponse } from './types';
import { analyzeAlerts, type AnalysisParams } from './api/client';
import { AlertCircle, Layout, X } from 'lucide-react';
import { getIncidentSeverityLabel } from './utils/severity';

function App() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [runbook, setRunbook] = useState<Runbook | null>(null);
  const [selectedId, setSelectedId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topIncidentService, setTopIncidentService] = useState<string>();
  const [isOutlookLinked, setIsOutlookLinked] = useState(false);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);

  const [selectedFilters, setSelectedFilters] = useState({
    applications: [] as string[],
    messages: [] as string[],
    environments: [] as string[],
    importance: [] as string[],
    timestamps: [] as string[]
  });

  const [showBanner, setShowBanner] = useState(() => localStorage.getItem('hideBanner') !== 'true');

  const closeBanner = () => {
    setShowBanner(false);
    localStorage.setItem('hideBanner', 'true');
  };

  const handleAnalyze = async (params?: AnalysisParams) => {
    setLoading(true);
    setError(null);
    try {
      const data: IncidentAnalysisResponse = await analyzeAlerts(false, params);
      setIncidents(data.incidents);
      setRunbook(data.runbook);
      setTopIncidentService(data.topIncidentService);
      setSelectedId(undefined); // Reset selection on new analyze

      // AUTO-SELECT ALL FILTERS ON SUCCESS
      const apps = Array.from(new Set(data.incidents.map(i => i.appName || 'Unknown API')));
      const msgs = Array.from(new Set(data.incidents.map(i => i.service)));
      const envs = Array.from(new Set(data.incidents.map(i => i.environment || 'Unspecified')));
      const imps = Array.from(new Set(data.incidents.map(i => getIncidentSeverityLabel(i))));
      const times = Array.from(new Set(data.incidents.map(i => new Date(i.timestamp).toLocaleDateString())));

      setSelectedFilters({
        applications: apps,
        messages: msgs,
        environments: envs,
        importance: imps,
        timestamps: times
      });

      setIsOutlookLinked(true); // Assuming success means it's linked
    } catch (err) {
      setError('Failed to analyze alerts. Please try again.');
      setIsOutlookLinked(false);
    } finally {
      setLoading(false);
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    // Strict filtering
    const appMatch = selectedFilters.applications.includes(incident.appName || 'Unknown API');
    const msgMatch = selectedFilters.messages.includes(incident.service);
    const envMatch = selectedFilters.environments.includes(incident.environment || 'Unspecified');
    const importanceMatch = selectedFilters.importance.includes(getIncidentSeverityLabel(incident));
    const timeMatch = selectedFilters.timestamps.includes(new Date(incident.timestamp).toLocaleDateString());

    return appMatch && msgMatch && envMatch && importanceMatch && timeMatch;
  });

  const selectedIncident = incidents?.find(i => i.id === selectedId);

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
      {showBanner && (
        <div className="bg-blue-600 text-white h-8 flex items-center justify-between px-4 text-[10px] font-bold tracking-wide uppercase relative z-[60]">
          <div className="flex-1 text-center">
            New: AI-Powered Runbook Automation is now live for MuleSoft environments. SnapLogic, Boomi & other iPaaS platforms coming soon.
          </div>
          <button onClick={closeBanner} className="text-white/80 hover:text-white transition-colors p-1">
            <X size={12} strokeWidth={3} />
          </button>
        </div>
      )}
      <Header isOutlookLinked={isOutlookLinked} />

      {error && (
        <div className="bg-red-50 px-6 py-3 border-b border-red-200 flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto hover:underline">Dismiss</button>
        </div>
      )}

      <main className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Left Panel: Filter Panel */}
        <div className="col-span-3 h-full overflow-hidden border-r border-gray-200 bg-white">
          <IncidentList
            incidents={incidents}
            selectedFilters={selectedFilters}
            onFilterChange={setSelectedFilters}
            onAnalyze={() => setShowAnalysisDialog(true)}
            loading={loading}
          />
        </div>

        {/* Right Panel: Incident Details or Grid */}
        <div className="col-span-9 h-full bg-gray-50 overflow-hidden relative">
          {selectedId && selectedIncident && runbook ? (
            <div className="h-full flex flex-col">
              <div className="p-4 bg-white border-b border-gray-200 flex items-center">
                <button
                  onClick={() => setSelectedId(undefined)}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold transition-colors flex items-center gap-2"
                >
                  <Layout size={14} />
                  Back to Grid
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <IncidentDetails
                  incident={selectedIncident}
                  runbook={runbook}
                  isTopIncident={selectedIncident.service === topIncidentService}
                />
              </div>
            </div>
          ) : (
            <IncidentGrid
              incidents={filteredIncidents}
              onSelect={setSelectedId}
              loading={loading}
            />
          )}

          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-blue-900 font-medium animate-pulse">Analyzing system alerts...</p>
            </div>
          )}
        </div>
      </main>

      <AnalysisDialog
        isOpen={showAnalysisDialog}
        onClose={() => setShowAnalysisDialog(false)}
        onSubmit={handleAnalyze}
      />
    </div>
  );
}

export default App;
