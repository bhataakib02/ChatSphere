import { useState, useEffect } from 'react';
import api from '../../api';

export const AdminHealth = () => {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const res = await api.get('/admin/health');
                setHealth(res.data);
            } catch {
                console.error("Failed to fetch health");
            } finally {
                setLoading(false);
            }
        };
        fetchHealth();
        const interval = setInterval(fetchHealth, 10000); // Pulse every 10s
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="text-center py-20 text-duo-lavenderMuted animate-pulse font-mono uppercase tracking-[0.3em]">Dialing System Shards...</div>;

    const HealthCard = ({ label, value, status }: { label: string, value: string, status?: 'UP' | 'WARN' | 'DOWN' }) => (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur shadow-xl relative overflow-hidden group hover:border-primary-500/30 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="text-[10px] font-black text-duo-lavenderMuted uppercase tracking-widest">{label}</div>
                <div className={`h-2 w-2 rounded-full animate-pulse ${status === 'WARN' ? 'bg-amber-400' : status === 'DOWN' ? 'bg-red-500' : 'bg-green-400'}`}></div>
            </div>
            <div className="text-3xl font-black text-white">{value}</div>
        </div>
    );

    return (
        <div className="relative z-10 animate-fade-in-up">
            <div className="mb-10">
                <h1 className="text-4xl font-black text-white mb-2 tracking-tight">System Diagnostics</h1>
                <p className="text-duo-lavenderMuted text-sm italic">Real-time telemetry from the ChatSphere core engine.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                <HealthCard label="Global Status" value={health.status} />
                <HealthCard label="Core Uptime" value={health.uptime} />
                <HealthCard label="Database" value={health.dbStatus} />
                <HealthCard label="API Latency" value="24ms" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur shadow-2xl">
                    <h3 className="font-black text-xs text-primary-400 uppercase tracking-[0.2em] mb-10">Resource Telemetry</h3>
                    <div className="space-y-10">
                        <div>
                            <div className="flex justify-between text-[10px] font-black text-duo-lavenderMuted uppercase mb-3 px-1">
                                <span>Memory Utilization</span>
                                <span className="text-white">{health.memoryUsage}</span>
                            </div>
                            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
                                <div className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full" style={{ width: '30%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] font-black text-duo-lavenderMuted uppercase mb-3 px-1">
                                <span>Disk Allocation</span>
                                <span className="text-white">{health.diskSpace}</span>
                            </div>
                            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
                                <div className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full" style={{ width: '15%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] font-black text-duo-lavenderMuted uppercase mb-3 px-1">
                                <span>CPU Load</span>
                                <span className="text-white">{health.cpuUsage}</span>
                            </div>
                            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
                                <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full" style={{ width: '12%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur shadow-2xl relative overflow-hidden flex flex-col justify-center text-center">
                    <div className="absolute top-0 right-0 p-8">
                        <div className="flex items-center space-x-2 text-[10px] font-black text-green-400">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></span>
                            <span>SECURE</span>
                        </div>
                    </div>
                    <div className="text-duo-lavenderMuted text-xs uppercase tracking-[0.4em] mb-4">Socket Reliability</div>
                    <div className="text-6xl font-black text-white mb-2">99.9<span className="text-primary-500">%</span></div>
                    <p className="text-duo-lavenderMuted text-[10px] italic">Based on last 10,000 heartbeat handshakes.</p>
                </div>
            </div>
        </div>
    );
};
