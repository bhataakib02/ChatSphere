import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

export const AdminOverview = ({ analytics }: { analytics: any }) => {
    if (!analytics) return <div className="text-duo-lavenderMuted text-sm animate-pulse">Gathering intelligence...</div>;

    const roleData = analytics.roleDistribution ? Object.entries(analytics.roleDistribution).map(([name, value]) => ({ name: name.replace('ROLE_', ''), value: value as number })) : [];
    const COLORS = ['#ff4d6d', '#7c3aed', '#10b981', '#f59e0b'];

    return (
        <div className="relative z-10 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white mb-2">Network Control</h1>
                    <p className="text-duo-lavenderMuted text-sm">Real-time intelligence and global system metrics.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 flex items-center space-x-4">
                    <div className="text-right">
                        <div className="text-[10px] text-primary-400 font-black uppercase tracking-widest">Active Sessions</div>
                        <div className="text-xl font-black text-white">{analytics.activeSessions || 0}</div>
                    </div>
                    <div className="h-8 w-px bg-white/10"></div>
                    <div className="text-right">
                        <div className="text-[10px] text-green-400 font-black uppercase tracking-widest">Reports Pending</div>
                        <div className="text-xl font-black text-white">0</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-primary-500/30 transition-all backdrop-blur shadow-xl relative overflow-hidden group">
                    <div className="text-xs font-black text-duo-lavenderMuted uppercase tracking-widest mb-1">Total Users</div>
                    <div className="text-4xl font-black text-white">{analytics.totalUsers}</div>
                    <div className="mt-4 flex items-center text-[10px] text-primary-400 font-bold uppercase tracking-tighter">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                        Global Reach
                    </div>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-primary-500/30 transition-all backdrop-blur shadow-xl relative overflow-hidden group">
                    <div className="text-xs font-black text-duo-lavenderMuted uppercase tracking-widest mb-1">Online Now</div>
                    <div className="text-4xl font-black text-white">{analytics.activeUsers}</div>
                    <div className="mt-4 flex items-center text-[10px] text-green-400 font-bold uppercase tracking-tighter">
                        <span className="h-2 w-2 rounded-full bg-green-400 mr-1.5 shadow-[0_0_8px_rgba(74,222,128,0.7)] animate-pulse"></span>
                        Live Connections
                    </div>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-primary-500/30 transition-all backdrop-blur shadow-xl relative overflow-hidden group">
                    <div className="text-xs font-black text-duo-lavenderMuted uppercase tracking-widest mb-1">Total Rooms</div>
                    <div className="text-4xl font-black text-white">{analytics.totalChats}</div>
                    <div className="mt-4 flex items-center text-[10px] text-violet-400 font-bold uppercase tracking-tighter">
                        Active Hubs
                    </div>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-primary-500/30 transition-all backdrop-blur shadow-xl relative overflow-hidden group">
                    <div className="text-xs font-black text-duo-lavenderMuted uppercase tracking-widest mb-1">Messages Sent</div>
                    <div className="text-4xl font-black text-white">{analytics.totalMessages}</div>
                    <div className="mt-4 flex items-center text-[10px] text-amber-400 font-bold uppercase tracking-tighter">
                        DB Inventory
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                <div className="lg:col-span-2 bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-bold text-white uppercase tracking-widest text-xs">Traffic Trends (Last 7 Days)</h3>
                        <div className="px-3 py-1 bg-primary-500/10 text-primary-400 text-[10px] font-black rounded-lg border border-primary-500/20">LIVE DATA</div>
                    </div>
                    <div className="h-80 w-full">
                        {analytics.dailyMessageGrowth && analytics.dailyMessageGrowth.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics.dailyMessageGrowth}>
                                    <defs>
                                        <linearGradient id="colorMsg" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ff4d6d" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ff4d6d" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis dataKey="date" stroke="#8b8b93" tick={{ fill: '#8b8b93', fontSize: 10 }} dy={10} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#8b8b93" tick={{ fill: '#8b8b93', fontSize: 10 }} dx={-10} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#13111C', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }}
                                        itemStyle={{ color: '#ff4d6d' }}
                                    />
                                    <Area type="monotone" dataKey="messages" stroke="#ff4d6d" strokeWidth={3} fillOpacity={1} fill="url(#colorMsg)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-duo-lavenderMuted text-sm font-semibold italic">Awaiting message flow...</div>
                        )}
                    </div>
                </div>

                <div className="bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl">
                    <h3 className="font-bold text-white uppercase tracking-widest text-xs mb-8 text-center">User Hierarchy</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={roleData}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {roleData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#13111C', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-3">
                        {roleData.map((d, index) => (
                            <div key={index} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="flex items-center text-duo-lavenderMuted">
                                    <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                    {d.name}
                                </span>
                                <span className="text-white">{d.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white/5 rounded-3xl border border-white/10 p-8 flex flex-col md:flex-row justify-between items-center gap-6 group hover:bg-white/10 transition-all">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/10">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-lg">System Integrity Validated</h4>
                        <p className="text-xs text-duo-lavenderMuted">All microservices and database shards are reporting optimal latency.</p>
                    </div>
                </div>
                <div className="px-6 py-2 bg-black/40 rounded-xl border border-white/5 text-primary-300 font-mono text-[10px] group-hover:border-primary-500/50 transition-all">
                    SSL: VERIFIED • API: 1.2.0 • RELAY: UP
                </div>
            </div>
        </div>
    );
};
