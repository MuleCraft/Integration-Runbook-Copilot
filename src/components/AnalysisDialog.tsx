import { useState } from 'react';
import { X } from 'lucide-react';

interface AnalysisDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (params: AnalysisParams) => void;
}

export interface AnalysisParams {
    count?: number;
    from?: string;
    to?: string;
}

export function AnalysisDialog({ isOpen, onClose, onSubmit }: AnalysisDialogProps) {
    const [countOption, setCountOption] = useState<string>('');
    const [customCount, setCustomCount] = useState<string>('');
    const [from, setFrom] = useState<string>('');
    const [to, setTo] = useState<string>('');
    const [error, setError] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        // Validation: if 'from' is selected, 'to' is mandatory
        if (from && !to) {
            setError('If "From" timestamp is selected, "To" timestamp is required.');
            return;
        }

        // Validation: if custom is selected, must have a value
        if (countOption === 'custom' && !customCount) {
            setError('Please enter a custom count value.');
            return;
        }

        // Validation: custom count must be a positive number
        if (countOption === 'custom' && (isNaN(parseInt(customCount)) || parseInt(customCount) <= 0)) {
            setError('Custom count must be a positive number.');
            return;
        }

        setError('');

        const params: AnalysisParams = {};

        // Determine count value
        if (countOption === 'custom' && customCount) {
            params.count = parseInt(customCount);
        } else if (countOption && countOption !== 'all') {
            params.count = parseInt(countOption);
        }

        if (from) params.from = from;
        if (to) params.to = to;

        onSubmit(params);
        onClose();

        // Reset form
        setCountOption('');
        setCustomCount('');
        setFrom('');
        setTo('');
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyze Alerts</h2>
                <p className="text-sm text-gray-500 mb-6">Configure analysis parameters (all optional)</p>

                <div className="space-y-4">
                    {/* Count Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Number of Alerts
                        </label>
                        <select
                            value={countOption}
                            onChange={(e) => {
                                setCountOption(e.target.value);
                                if (e.target.value !== 'custom') {
                                    setCustomCount('');
                                }
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            <option value="">All alerts</option>
                            <option value="10">Last 10</option>
                            <option value="20">Last 20</option>
                            <option value="50">Last 50</option>
                            <option value="100">Last 100</option>
                            <option value="custom">Custom...</option>
                        </select>
                    </div>

                    {/* Custom Count Input */}
                    {countOption === 'custom' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Custom Count
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={customCount}
                                onChange={(e) => setCustomCount(e.target.value)}
                                placeholder="Enter number of alerts"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>
                    )}

                    {/* From Timestamp */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            From Timestamp
                        </label>
                        <input
                            type="datetime-local"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {/* To Timestamp */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            To Timestamp {from && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="datetime-local"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                    >
                        Analyze
                    </button>
                </div>
            </div>
        </div>
    );
}
