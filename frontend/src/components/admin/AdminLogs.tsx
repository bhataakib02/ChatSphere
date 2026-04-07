import { useState, useEffect } from 'react';
import api from '../../api';

export const AdminLogs = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/admin/logs');
            setLogs(res.data);
        } catch {
            console.error("Failed to fetch logs");
        } finally {
            setLoading(false);
        }
    };

    const getActionBadge = (action: string) => {
        const colors: any = {
            'BAN_USER': 'bg-red-500/20 text-red-300 border-red-500/30',
            'TOGGLE_USER_LOCK': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
            'CHANGE_ROLE': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
            'RESOLVE_REPORT': 'bg-green-500/20 text-green-300 border-green-500/30',
            'DELETE_CHAT': 'bg-red-500/20 text-red-300 border-red-500/30',
            'DELETE_MESSAGE': 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        };
        return (
            <span className={`px-2 py-0.5 rounded border text-[9px] font-black tracking-widest uppercase ${colors[action] || 'bg-white/10 text-white'}`}>
                {action.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="relative z-10 animate-fade-in-up">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">Audit Logs</h1>
                    <p className="text-duo-lavenderMuted">System-wide record of every administrative action for accountability.</p>
                </div>
                {logs.length > 0 && (
                    <button onClick={async () => {
                        if (window.confirm('Delete all audit logs?')) {
                            await api.delete('/admin/cleanup?type=ALL_LOGS');
                            fetchLogs();
                        }
                    }} className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-lg scale-95 hover:scale-100">
                        Clear All Logs
                    </button>
                )}
            </div>

            {loading ? (
                <div className="py-20 text-center animate-pulse">Accessing archives...</div>
            ) : (
                <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden backdrop-blur shadow-xl">
                    <div className="max-h-[600px] overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-duo-voidDeep/80 sticky top-0 z-10 text-[10px] uppercase text-duo-lavenderMuted font-black tracking-widest border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Admin</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">Details</th>
                                    <th className="px-6 py-4">Target</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-xs font-mono text-duo-lavenderMuted whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-6 h-6 rounded bg-primary-500/20 flex items-center justify-center text-[10px] font-bold text-primary-300">
                                                    {log.admin?.username.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-white text-xs">{log.admin?.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getActionBadge(log.action)}
                                        </td>
                                        <td className="px-6 py-4 text-duo-mist text-xs italic">
                                            {log.details}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-primary-300">
                                            ID: #{log.targetId}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {logs.length === 0 && (
                            <div className="py-20 text-center text-duo-lavenderMuted font-medium">No system logs found.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
