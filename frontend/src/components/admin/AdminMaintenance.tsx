import { useState } from 'react';
import api from '../../api';

export const AdminMaintenance = () => {
    const [status, setStatus] = useState<string | null>(null);
    const [loadingType, setLoadingType] = useState<string | null>(null);

    const handleCleanup = async (type: string) => {
        setLoadingType(type);
        try {
            const res = await api.delete(`/admin/cleanup?type=${type}`);
            setStatus(res.data.message);
        } catch {
            setStatus("Operation failed.");
        } finally {
            setLoadingType(null);
        }
    };

    const ToolCard = ({ title, desc, type, icon, color }: any) => (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all group">
            <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-6 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-duo-lavenderMuted text-xs mb-8 leading-relaxed">{desc}</p>
            <button
                onClick={() => handleCleanup(type)}
                disabled={!!loadingType}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all disabled:opacity-50"
            >
                {loadingType === type ? 'Executing...' : 'Trigger Manual Run'}
            </button>
        </div>
    );

    return (
        <div className="relative z-10 animate-fade-in-up">
            <h1 className="text-3xl font-extrabold text-white mb-2">Systems Maintenance</h1>
            <p className="text-duo-lavenderMuted text-sm mb-10">Execute high-level maintenance protocols and data hygiene tasks.</p>

            {status && (
                <div className="mb-10 p-4 bg-primary-500/10 border border-primary-500/20 rounded-2xl text-primary-300 text-xs font-bold text-center animate-pulse">
                    {status}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <ToolCard
                    title="Purge Old Messages"
                    desc="Deletes message history older than 30 days to optimize database index performance and reduce storage overhead."
                    type="MESSAGES"
                    color="bg-primary-500 text-white"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>}
                />
                <ToolCard
                    title="Cleanup Inactive Accounts"
                    desc="Identifies and removes user accounts that have not authenticated in over 365 days. Free up usernames and reduce junk data."
                    type="INACTIVE_USERS"
                    color="bg-amber-500 text-white"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>}
                />
                <ToolCard
                    title="Rebuild Search Index"
                    desc="Forces a global re-indexing of the chat and message shards. Resolves search latency and consistency issues."
                    type="INDEX"
                    color="bg-violet-500 text-white"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>}
                />
            </div>

            <div className="mt-12 p-8 bg-white/5 border border-white/10 rounded-3xl border-dashed">
                <h4 className="text-white font-bold text-sm mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    Critical Note
                </h4>
                <p className="text-duo-lavenderMuted text-xs leading-relaxed">
                    Maintenance operations are irreversible. Ensure you have a verified snapshot of the production database before executing bulk deletion protocols. Audit logs will record the executor of every manual trigger.
                </p>
            </div>
        </div>
    );
};
