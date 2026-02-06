import { useState, useEffect } from 'react';
import { User, Mail, X, Check } from 'lucide-react';
import { getUserInfo, setUserInfo, type UserInfo } from '../utils/user';

interface UserProfileProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UserProfile({ isOpen, onClose }: UserProfileProps) {
    const [, setUserInfoState] = useState<UserInfo>({
        name: '',
        email: '',
        initials: ''
    });
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (isOpen) {
            getUserInfo().then(info => {
                setUserInfoState(info);
                setName(info.name);
                setEmail(info.email);
            });
        }
    }, [isOpen]);

    const handleSave = () => {
        if (name.trim()) {
            setUserInfo(name.trim(), email.trim());
            onClose();
            // Reload to update avatar
            window.location.reload();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">User Profile</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Avatar Preview */}
                    <div className="flex justify-center mb-4">
                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 text-white flex items-center justify-center font-bold text-2xl shadow-lg">
                            {name ? name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : '??'}
                        </div>
                    </div>

                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <User size={14} className="inline mr-1" />
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>

                    {/* Email Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Mail size={14} className="inline mr-1" />
                            Email (Optional)
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your.email@company.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>

                    {/* Info Text */}
                    <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                        <strong>Note:</strong> Your information is stored locally in your browser and never sent to any server.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Check size={16} />
                        Save Profile
                    </button>
                </div>
            </div>
        </div>
    );
}
