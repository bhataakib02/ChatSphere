import { useState, useEffect } from 'react';
import api from '../../api';
import { useNotification } from '../../context/NotificationContext';

export const AdminContacts = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const { showNotification } = useNotification();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/admin/contacts');
            setRequests(res.data || []);
        } catch {
            console.error("Failed to fetch contact requests");
        }
    };

    const deleteRequest = async (id: number) => {
        if (!window.confirm("Remove this friend request permanently?")) return;
        try {
            await api.delete(`/admin/cleanup?type=ALL_CONTACTS`);
            setRequests(prev => prev.filter(r => r.id !== id));
            showNotification("Contact request removed", "success");
        } catch {
            showNotification("Failed to remove request", "error");
        }
    };

    return (
        <div className="relative z-10 animate-fade-in-up">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">Contact Audit</h1>
                    <p className="text-duo-lavenderMuted text-sm">Monitor global connection requests and eliminate spam networks.</p>
                </div>
                {requests.length > 0 && (
                    <button onClick={async () => {
                        if (window.confirm('Wipe all connection and friend request data?')) {
                            await api.delete('/admin/cleanup?type=ALL_CONTACTS');
                            fetchRequests();
                        }
                    }} className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-lg scale-95 hover:scale-100">
                        Clear All Connections
                    </button>
                )}
            </div>

            {requests.length === 0 ? (
                <div className="py-20 bg-white/5 rounded-2xl border border-dashed border-white/10 text-center text-duo-lavenderMuted">
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <p className="font-medium text-lg">No Contact Requests</p>
                    <p className="text-sm">No friend requests found in the system.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {requests.map((r) => (
                        <div key={r.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all relative overflow-hidden text-left">
                            {r.risk === 'HIGH' && <div className="absolute top-0 right-0 bg-red-500/20 text-red-400 text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-tighter shadow-sm shadow-red-500/10 animate-pulse">Suspicious Activity</div>}

                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center font-bold text-primary-300">
                                        {r.sender.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">@{r.sender}</div>
                                        <div className="text-[10px] text-duo-lavenderMuted uppercase tracking-widest font-black">Sender</div>
                                    </div>
                                </div>
                                <svg className="w-4 h-4 text-duo-lavenderMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                <div className="flex items-center space-x-3">
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-white">@{r.receiver}</div>
                                        <div className="text-[10px] text-duo-lavenderMuted uppercase tracking-widest font-black">Target</div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center font-bold text-violet-300">
                                        {r.receiver.charAt(0)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${r.status === 'ACCEPTED' ? 'bg-green-500/20 text-green-300' : r.status === 'REJECTED' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                    {r.status}
                                </span>
                                <div className="flex items-center space-x-2">
                                    <span className="text-[10px] text-duo-lavenderMuted font-mono">{new Date(r.createdAt).toLocaleDateString()}</span>
                                    <button
                                        onClick={() => deleteRequest(r.id)}
                                        className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 px-2 py-1 rounded-lg text-[10px] font-black transition-all"
                                        title="Delete Request"
                                    >
                                        DELETE
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
