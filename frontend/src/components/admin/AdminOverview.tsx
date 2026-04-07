import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminOverview = ({ analytics }: { analytics: any }) => {
    if (!analytics) return <div className="text-duo-lavenderMuted text-sm animate-pulse">Gathering intelligence...</div>;

    return (
        <div className="relative z-10 animate-fade-in-up">
            <h1 className="text-3xl font-extrabold text-white mb-2">Platform Overview</h1>
            <p className="text-duo-lavenderMuted mb-8">High-level structural analytics of the ChatSphere network.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-primary-500/15 rounded-full blur-xl group-hover:bg-primary-500/25 transition-all"></div>
                    <div className="text-sm font-semibold text-duo-lavenderMuted uppercase tracking-widest mb-1">Total Users</div>
                    <div className="text-4xl font-black text-white">{analytics.totalUsers}</div>
                    <div className="mt-4 flex items-center text-xs text-primary-300 font-medium">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                        All Registered
                    </div>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-duo-blush/20 rounded-full blur-xl group-hover:bg-duo-blush/30 transition-all"></div>
                    <div className="text-sm font-semibold text-duo-lavenderMuted uppercase tracking-widest mb-1">Active Now</div>
                    <div className="text-4xl font-black text-white">{analytics.activeUsers}</div>
                    <div className="mt-4 flex items-center text-xs text-primary-300 font-medium">
                        <span className="h-2 w-2 rounded-full bg-primary-400 mr-1.5 shadow-[0_0_8px_rgba(255,77,109,0.7)]"></span>
                        WebSockets Live
                    </div>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-violet-500/15 rounded-full blur-xl group-hover:bg-violet-500/25 transition-all"></div>
                    <div className="text-sm font-semibold text-duo-lavenderMuted uppercase tracking-widest mb-1">Total Chats</div>
                    <div className="text-4xl font-black text-white">{analytics.totalChats}</div>
                    <div className="mt-4 flex items-center text-xs text-violet-300 font-medium">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                        Rooms & DMs
                    </div>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all"></div>
                    <div className="text-sm font-semibold text-duo-lavenderMuted uppercase tracking-widest mb-1">Total Messages</div>
                    <div className="text-4xl font-black text-white">{analytics.totalMessages}</div>
                    <div className="mt-4 flex items-center text-xs text-amber-300 font-medium">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                        Stored in DB
                    </div>
                </div>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-8 shadow-xl">
                <h3 className="font-semibold text-white mb-6 uppercase tracking-wider text-sm flex items-center">
                    <svg className="w-4 h-4 mr-2 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
                    Daily Message Volume (Last 7 Days)
                </h3>
                <div className="h-72 w-full">
                    {analytics.dailyMessageGrowth && analytics.dailyMessageGrowth.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics.dailyMessageGrowth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="date" stroke="#8b8b93" tick={{ fill: '#8b8b93', fontSize: 12 }} dy={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#8b8b93" tick={{ fill: '#8b8b93', fontSize: 12 }} dx={-10} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#13111C', borderColor: '#ffffff20', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#ff4d6d' }}
                                />
                                <Line type="monotone" dataKey="messages" stroke="#ff4d6d" strokeWidth={4} dot={{ r: 4, fill: '#ff4d6d', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#fff', stroke: '#ff4d6d', strokeWidth: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-duo-lavenderMuted text-sm font-semibold italic">Not enough historical data to generate graph.</div>
                    )}
                </div>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <h3 className="font-semibold text-white mb-2">System Status</h3>
                <div className="flex items-center space-x-2 text-sm text-primary-300 font-mono">
                    <span className="h-2 w-2 bg-primary-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(255,77,109,0.7)]"></span>
                    <span>All services operational. API Health: Optimal.</span>
                </div>
            </div>
        </div>
    );
};
