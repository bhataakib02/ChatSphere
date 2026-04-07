import { useState, useEffect } from 'react';
import api from '../../api';
import { useNotification } from '../../context/NotificationContext';

export const AdminSessions = () => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/sessions');
            setSessions(res.data);
        } catch {
            showNotification("Failed to fetch sessions", "error");
        } finally {
            setLoading(false);
        }
    };

    const terminateSession = async (id: number) => {
        if (!window.confirm("Force logout this session? The user will need to log in again.")) return;
        try {
            await api.delete(`/admin/sessions/${id}`);
            setSessions(sessions.filter(s => s.id !== id));
            showNotification("Session terminated successfully", "success");
        } catch {
            showNotification("Failed to terminate session.", "error");
        }
    };

    return (
        <div className="relative z-10 animate-fade-in-up">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">Active Sessions</h1>
                    <p className="text-duo-lavenderMuted text-sm">Monitor and secure user access across all devices.</p>
                </div>
                {sessions.length > 0 && (
                    <button onClick={async () => {
                        if (window.confirm('Terminate ALL active sessions? Users will be logged out.')) {
                            await api.delete('/admin/cleanup?type=ALL_SESSIONS');
                            fetchSessions();
                        }
                    }} className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-lg scale-95 hover:scale-100">
                        Terminate All
                    </button>
                )}
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-duo-voidDeep/80 text-[10px] uppercase text-duo-lavenderMuted font-black tracking-widest border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Device / Browser</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-20 text-center text-duo-lavenderMuted animate-pulse italic">Scanning network sessions...</td></tr>
                            ) : sessions.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-20 text-center text-duo-lavenderMuted">No active sessions found.</td></tr>
                            ) : (
                                sessions.map(s => (
                                    <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-500/20 text-primary-300 flex items-center justify-center font-bold text-xs">
                                                    {s.username.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-white">@{s.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-duo-mist font-medium">{s.device || 'Unknown Device'}</td>
                                        <td className="px-6 py-4 text-duo-lavenderMuted text-xs">{s.location || 'Remote IP'}</td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center text-[10px] font-black text-green-400 uppercase tracking-widest">
                                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                                                Active Now
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => terminateSession(s.id)}
                                                className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black border border-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                TERMINATE
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
