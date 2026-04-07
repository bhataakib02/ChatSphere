import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AuthService from '../services/auth.service';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (!user || (user.role !== 'ROLE_ADMIN' && user.role !== 'ROLE_SUPER_ADMIN')) {
            navigate("/dashboard");
            return;
        }
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- gate + load once on mount
    }, [navigate]);

    const fetchData = async () => {
        try {
            const [analyticsRes, usersRes] = await Promise.all([
                api.get('/admin/analytics'),
                api.get('/admin/users')
            ]);
            setAnalytics(analyticsRes.data);
            setUsers(usersRes.data);
        } catch (err: any) {
            setError("Access denied or API failure.");
            if (err.response?.status === 403) navigate("/dashboard");
        } finally {
            setLoading(false);
        }
    };

    const toggleLock = async (userId: number) => {
        try {
            await api.put(`/admin/users/${userId}/toggle-lock`, {});
            setUsers(users.map(u => u.id === userId ? { ...u, locked: !u.locked } : u));
        } catch {
            alert("Failed to toggle user status.");
        }
    };

    if (loading) return <div className="min-h-screen bg-duo-void flex items-center justify-center text-duo-mist"><div className="animate-spin h-8 w-8 border-4 border-primary-400 border-t-transparent rounded-full"></div></div>;

    return (
        <div className="flex h-screen bg-duo-void font-sans text-duo-mist overflow-hidden">

            <div className="w-64 border-r border-white/10 bg-duo-voidDeep shadow-2xl shadow-primary-900/20 flex flex-col z-20 shrink-0">
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-duo-blush to-violet-300 tracking-tight">Super Admin</h2>
                    <p className="text-xs text-duo-lavenderMuted mt-1 font-mono uppercase tracking-widest">Command Center</p>
                </div>

                <div className="flex-1 py-6 px-4 space-y-2">
                    <button type="button" onClick={() => setActiveTab('overview')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'overview' ? 'bg-primary-500/15 text-primary-300' : 'text-duo-lavenderMuted hover:bg-white/5 hover:text-duo-mist'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span>Platform Overview</span>
                    </button>
                    <button type="button" onClick={() => setActiveTab('users')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'users' ? 'bg-primary-500/15 text-primary-300' : 'text-duo-lavenderMuted hover:bg-white/5 hover:text-duo-mist'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                        <span>User Management</span>
                    </button>
                    <button type="button" onClick={() => navigate('/dashboard')} className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm text-duo-lavenderMuted hover:bg-white/5 hover:text-duo-mist mt-8 border border-white/10">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"></path></svg>
                        <span>Return to App</span>
                    </button>
                </div>

                <div className="p-4 border-t border-white/10 bg-duo-void/50">
                    <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center font-bold text-xs ring-2 ring-primary-900/50">A</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">Administrator</p>
                            <p className="text-[10px] text-primary-300">Level 5 Clearance</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 relative">
                <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-primary-900/25 to-transparent pointer-events-none"></div>

                {error ? (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl">{error}</div>
                ) : activeTab === 'overview' && analytics ? (
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
                                <div className="text-sm font-semibold text-duo-lavenderMuted uppercase tracking-widest mb-1">Messages</div>
                                <div className="text-4xl font-black text-white">{analytics.totalMessages}</div>
                                <div className="mt-4 flex items-center text-xs text-amber-300 font-medium">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                    Stored in DB
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                            <h3 className="font-semibold text-white mb-2">System Status</h3>
                            <div className="flex items-center space-x-2 text-sm text-primary-300 font-mono">
                                <span className="h-2 w-2 bg-primary-400 rounded-full"></span>
                                <span>All services operational. No server bottlenecks detected.</span>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'users' ? (
                    <div className="relative z-10 animate-fade-in-up">
                        <h1 className="text-3xl font-extrabold text-white mb-2">User Management</h1>
                        <p className="text-duo-lavenderMuted mb-8">Monitor, restrict, and enforce discipline on the platform.</p>

                        <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur shadow-xl overflow-hidden">
                            <table className="w-full text-left text-sm text-duo-mist/90">
                                <thead className="bg-duo-voidDeep/80 text-xs uppercase text-duo-lavenderMuted font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">ID</th>
                                        <th className="px-6 py-4">Username</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-mono text-duo-lavenderMuted">{user.id}</td>
                                            <td className="px-6 py-4 font-semibold text-white flex items-center space-x-3">
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ring-1 ring-white/20 shrink-0 ${user.locked ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-duo-mist'}`}>
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <span>{user.username}</span>
                                            </td>
                                            <td className="px-6 py-4">{user.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest ${user.role === 'ROLE_SUPER_ADMIN' ? 'bg-violet-500/20 text-violet-300' :
                                                    user.role === 'ROLE_ADMIN' ? 'bg-primary-500/20 text-primary-300' :
                                                        'bg-white/10 text-duo-lavenderMuted'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.locked ? (
                                                    <span className="flex items-center text-red-300 text-xs font-semibold">
                                                        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                                        LOCKED
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-primary-300 text-xs font-semibold">
                                                        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                        ACTIVE
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleLock(user.id)}
                                                    disabled={user.role === 'ROLE_SUPER_ADMIN'}
                                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${user.locked
                                                        ? 'bg-primary-500/15 text-primary-300 border border-primary-500/30 hover:bg-primary-500 hover:text-white'
                                                        : 'bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500 hover:text-white'
                                                        }`}
                                                >
                                                    {user.locked ? 'UNLOCK USER' : 'LOCK USER'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fade-in-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
            `}} />
        </div>
    );
};

export default AdminDashboard;
