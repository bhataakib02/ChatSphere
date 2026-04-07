import { useState, useEffect } from 'react';
import api from '../../api';

export const AdminContacts = () => {
    const [requests, setRequests] = useState<any[]>([]);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            // Simulated endpoint for now, will implement on backend
            const res = await api.get('/admin/contacts');
            setRequests(res.data);
        } catch {
            console.error("Failed to fetch contact requests");
            // Placeholder data for demo
            setRequests([
                { id: 1, sender: "SpammerBot", receiver: "Aakib", status: "PENDING", createdAt: new Date().toISOString(), risk: "HIGH" },
                { id: 2, sender: "NormalUser", receiver: "Alice", status: "ACCEPTED", createdAt: new Date().toISOString(), risk: "NONE" }
            ]);
        }
    };

    return (
        <div className="relative z-10 animate-fade-in-up">
            <h1 className="text-3xl font-extrabold text-white mb-2">Contact Audit</h1>
            <p className="text-duo-lavenderMuted text-sm mb-8">Monitor global connection requests and eliminate spam networks.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests.map((r) => (
                    <div key={r.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group relative overflow-hidden text-left">
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
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${r.status === 'ACCEPTED' ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                {r.status}
                            </span>
                            <span className="text-[10px] text-duo-lavenderMuted font-mono">
                                {new Date(r.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
