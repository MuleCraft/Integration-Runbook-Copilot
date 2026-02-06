import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useUserInfo } from '../utils/user';
import { UserProfile } from './UserProfile';

interface HeaderProps {
    isOutlookLinked: boolean;
}

export function Header({ isOutlookLinked }: HeaderProps) {
    const userInfo = useUserInfo();
    const [showProfile, setShowProfile] = useState(false);
    
    return (
        <>
            <UserProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />
        <header className="h-20 border-b border-gray-200 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <ShieldAlert className="text-white" size={22} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
                        Alert<span className="text-blue-600">Lens</span>
                    </h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Integration Runbook Copilot</p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider">
                    {isOutlookLinked && (
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Outlook Linked</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100 shadow-sm">
                        <img src="/gemini3.svg" alt="Gemini" className="w-4 h-4 object-contain" />
                        <span>Powered by Gemini 3</span>
                    </div>
                </div>

                <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>

                <button 
                    onClick={() => setShowProfile(true)}
                    className="flex items-center gap-2 hover:scale-105 transition-transform group"
                    title={`${userInfo.name}${userInfo.email ? ` (${userInfo.email})` : ''} - Click to edit`}
                >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 border-2 border-white shadow-xl text-white flex items-center justify-center font-bold text-sm group-hover:from-blue-600 group-hover:to-indigo-700 transition-all">
                        {userInfo.initials}
                    </div>
                </button>
            </div>
        </header>
        </>
    );
}
