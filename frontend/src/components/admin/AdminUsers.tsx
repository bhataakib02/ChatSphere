import { useState } from 'react';
import api from '../../api';
import { useNotification } from '../../context/NotificationContext';

export const AdminUsers = ({ users, setUsers, currentUserRole }: { users: any[], setUsers: any, currentUserRole: string }) => {
    const [search, setSearch] = useState("");
    const { showNotification } = useNotification();

    const toggleLock = async (userId: number) => {
        try {
            const res = await api.put(`/admin/users/${userId}/toggle-lock`, {});
            setUsers(users.map(u => u.id === userId ? { ...u, locked: res.data.locked } : u));
            showNotification(`User ${res.data.locked ? 'Banned' : 'Unbanned'} successfully`, 'success');
        } catch (e: any) {
            showNotification(e.response?.data?.error || "Failed to toggle user status.", 'error');
        }
    };

    const changeRole = async (userId: number, newRole: string) => {
        try {
            await api.put(`/admin/users/${userId}/role`, { role: newRole });
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            showNotification("User role updated", 'success');
        } catch (e: any) {
            showNotification(e.response?.data?.error || "Failed to change user role.", 'error');
        }
    };

    const deleteUser = async (userId: number) => {
        // We still keep confirm for safety, but we could make a custom ultra-fast one if needed.
        // For now, let's just make the result notification fast.
        if (!window.confirm("Are you SURE you want to permanently delete this user?")) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
            showNotification("User permanently deleted", 'success');
        } catch (e: any) {
            showNotification(e.response?.data?.error || "Failed to delete user.", 'error');
        }
    };

    const resetPassword = async (userId: number) => {
        const newPass = window.prompt("Enter new password for this user (min 6 chars):");
        if (!newPass) return;
        try {
            await api.put(`/admin/users/${userId}/reset-password`, { password: newPass });
            showNotification("Password reset successfully", 'success');
        } catch (e: any) {
            showNotification(e.response?.data?.error || "Failed to reset password.", 'error');
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative z-10 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">User Management</h1>
                    <p className="text-duo-lavenderMuted">Monitor restrict, and enforce discipline on the platform.</p>
                </div>
                <div className="relative">
                    <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-duo-lavenderMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all font-medium placeholder-duo-lavenderMuted/50 w-64"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur shadow-xl overflow-hidden w-full overflow-x-auto">
                <table className="w-full text-left text-sm text-duo-mist/90 min-w-[800px]">
                    <thead className="bg-duo-voidDeep/80 text-xs uppercase text-duo-lavenderMuted font-bold tracking-wider border-b border-white/5">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Emails & Joined Date</th>
                            <th className="px-6 py-4">Msgs Sent</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-lg ring-2 shrink-0 ${user.locked ? 'bg-red-500/20 text-red-300 ring-red-500/30' : user.online ? 'bg-primary-500/20 text-primary-300 ring-primary-500/30' : 'bg-white/10 text-white ring-white/10'}`}>
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-base flex items-center">
                                                {user.username}
                                                {user.role === 'ROLE_SUPER_ADMIN' && <svg className="w-4 h-4 ml-1 text-violet-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.984 3.984 0 01-2.639-1.006l-1.002.501.006.005a5.467 5.467 0 01-2.73 1.396A5.468 5.468 0 016 15c-.62 0-1.21-.14-1.735-.389l-1.002-.501L2.639 15A3.989 3.989 0 010 12.22a1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L7 2.323V3a1 1 0 012 0V2z" clipRule="evenodd"></path></svg>}
                                            </div>
                                            <div className="text-xs text-duo-lavenderMuted font-mono">ID: #{user.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-duo-mist">{user.email}</div>
                                    <div className="text-xs text-duo-lavenderMuted/70 mt-0.5">Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-mono text-white bg-white/5 w-fit px-2 py-1 rounded border border-white/10">{user.messageCount || 0}</div>
                                </td>
                                <td className="px-6 py-4">
                                    {currentUserRole === 'ROLE_SUPER_ADMIN' ? (
                                        <select
                                            value={user.role}
                                            onChange={(e) => changeRole(user.id, e.target.value)}
                                            className="bg-black/20 border border-white/10 rounded-lg text-xs font-bold px-2 py-1.5 text-white focus:outline-none focus:border-primary-500/50 cursor-pointer"
                                        >
                                            <option value="ROLE_USER">User</option>
                                            <option value="ROLE_SUPER_ADMIN">Super Admin</option>
                                        </select>
                                    ) : (
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest ${user.role === 'ROLE_SUPER_ADMIN' ? 'bg-violet-500/20 text-violet-300' :
                                            user.role === 'ROLE_ADMIN' ? 'bg-primary-500/20 text-primary-300' :
                                                'bg-white/10 text-duo-lavenderMuted'
                                            }`}>
                                            {user.role}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {user.locked ? (
                                        <span className="flex items-center text-red-400 text-xs font-semibold bg-red-400/10 w-fit px-2 py-1 rounded-md">
                                            <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd"></path></svg>
                                            BANNED
                                        </span>
                                    ) : user.online ? (
                                        <span className="flex items-center text-green-400 text-xs font-semibold bg-green-400/10 w-fit px-2 py-1 rounded-md">
                                            <span className="h-1.5 w-1.5 rounded-full bg-green-400 mr-2 shadow-[0_0_5px_rgba(74,222,128,0.8)]"></span>
                                            ONLINE
                                        </span>
                                    ) : (
                                        <span className="flex items-center text-duo-lavenderMuted text-xs font-semibold">
                                            OFFLINE
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => resetPassword(user.id)}
                                            className="px-3 py-2 rounded-lg text-xs font-bold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all"
                                        >
                                            EDIT PASS
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggleLock(user.id)}
                                            disabled={user.role === 'ROLE_SUPER_ADMIN' && user.id === 1}
                                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${user.locked
                                                ? 'bg-primary-500/15 text-primary-300 border border-primary-500/30 hover:bg-primary-500 hover:text-white'
                                                : 'bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500 hover:text-white'
                                                }`}
                                        >
                                            {user.locked ? 'UNBAN' : 'BAN'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deleteUser(user.id)}
                                            disabled={user.role === 'ROLE_SUPER_ADMIN'}
                                            className="px-3 py-2 rounded-lg text-xs font-bold bg-rose-600/20 text-rose-400 border border-rose-600/30 hover:bg-rose-600 hover:text-white transition-all disabled:opacity-30"
                                        >
                                            DELETE
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="py-12 text-center text-duo-lavenderMuted font-medium">No users found matching your search.</div>
                )}
            </div>
        </div>
    );
};
