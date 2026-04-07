import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AuthService from '../services/auth.service';
import { AdminOverview } from '../components/admin/AdminOverview';
import { AdminUsers } from '../components/admin/AdminUsers';
import { AdminReports } from '../components/admin/AdminReports';
import { AdminGroups } from '../components/admin/AdminGroups';
import { AdminLogs } from '../components/admin/AdminLogs';
import { AdminSettings } from '../components/admin/AdminSettings';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState('overview');
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (!user || (user.role !== 'ROLE_ADMIN' && user.role !== 'ROLE_SUPER_ADMIN')) {
            navigate("/dashboard");
            return;
        }
        setCurrentUser(user);
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- load once
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

    if (loading) return <div className="min-h-screen bg-duo-void flex items-center justify-center text-duo-mist"><div className="animate-spin h-8 w-8 border-4 border-primary-400 border-t-transparent rounded-full"></div></div>;

    const navItems = [
        { id: 'overview', label: 'Platform Overview', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> },
        { id: 'users', label: 'User Management', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> },
        { id: 'reports', label: 'Reports & Moderation', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> },
        { id: 'groups', label: 'Group Control', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg> },
        { id: 'logs', label: 'Audit Logs', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg> },
        { id: 'settings', label: 'System Settings', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><circle cx="12" cy="12" r="3"></circle></svg> },
    ];

    const renderContent = () => {
        if (error) return <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl">{error}</div>;

        switch (activeTab) {
            case 'overview':
                return <AdminOverview analytics={analytics} />;
            case 'users':
                return <AdminUsers users={users} setUsers={setUsers} currentUserRole={currentUser?.role} />;
            case 'reports':
                return <AdminReports />;
            case 'groups':
                return <AdminGroups />;
            case 'logs':
                return <AdminLogs />;
            case 'settings':
                return <AdminSettings />;

            default:
                return null;
        }
    };


    return (
        <div className="flex h-screen bg-duo-void font-sans text-duo-mist overflow-hidden">
            {/* Sidebar */}
            <div className="w-72 border-r border-white/10 bg-duo-voidDeep shadow-2xl shadow-primary-900/20 flex flex-col z-20 shrink-0">
                <div className="p-8 border-b border-white/10">
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-duo-blush to-violet-300 tracking-tight">Super Admin</h2>
                    <p className="text-xs text-duo-lavenderMuted mt-1 font-mono uppercase tracking-widest">Command Center</p>
                </div>

                <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${activeTab === item.id
                                ? 'bg-primary-500/15 text-primary-300 shadow-inner'
                                : 'text-duo-lavenderMuted hover:bg-white/5 hover:text-duo-mist'
                                }`}
                        >
                            <span className={activeTab === item.id ? 'text-primary-400' : ''}>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}

                    <div className="pt-8 mt-8 border-t border-white/5">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm text-duo-lavenderMuted hover:bg-red-500/10 hover:text-red-300 group"
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"></path></svg>
                            <span>Exit Admin Panel</span>
                        </button>
                    </div>
                </nav>

                <div className="p-6 border-t border-white/10 bg-black/20">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center font-bold text-lg ring-2 ring-primary-900/50 shadow-lg capitalize">
                            {currentUser?.username.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{currentUser?.username}</p>
                            <p className="text-[10px] text-primary-300 font-mono tracking-tighter uppercase">{currentUser?.role.replace('ROLE_', '')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-10 relative">
                <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-primary-900/10 to-transparent pointer-events-none"></div>

                <div className="max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
            `}} />
        </div>
    );
};

export default AdminDashboard;
