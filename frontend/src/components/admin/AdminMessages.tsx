import { useState, useEffect } from 'react';
import api from '../../api';

export const AdminMessages = () => {
    const [messages, setMessages] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [userFilter, setUserFilter] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/messages', {
                params: { search, username: userFilter }
            });
            setMessages(res.data);
        } catch {
            console.error("Failed to fetch messages");
        } finally {
            setLoading(false);
        }
    };

    const deleteMessage = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this message globally?")) return;
        try {
            await api.delete(`/admin/messages/${id}`);
            setMessages(messages.filter(m => m.id !== id));
        } catch {
            alert("Failed to delete message.");
        }
    };

    return (
        <div className="relative z-10 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">Message Moderation</h1>
                    <p className="text-duo-lavenderMuted text-sm">Audit and remove any content violating platform policies.</p>
                </div>
                <div className="flex space-x-3">
                    <input
                        type="text"
                        placeholder="Filter by user..."
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary-500/50 transition-all text-xs w-40"
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                    />
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search content..."
                            className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary-500/50 transition-all text-xs w-60"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-duo-lavenderMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <button onClick={fetchMessages} className="bg-primary-500 hover:bg-primary-400 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">Search</button>
                </div>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-duo-mist">
                        <thead className="bg-duo-voidDeep/80 text-[10px] uppercase text-duo-lavenderMuted font-black tracking-widest border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4">Sender</th>
                                <th className="px-6 py-4">Content</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-20 text-center text-duo-lavenderMuted animate-pulse">Scanning database...</td></tr>
                            ) : messages.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-20 text-center text-duo-lavenderMuted">No messages found.</td></tr>
                            ) : (
                                messages.map(m => (
                                    <tr key={m.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-primary-300">@{m.sender}</td>
                                        <td className="px-6 py-4 max-w-md truncate text-white">{m.content}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.type === 'TEXT' ? 'bg-white/10 text-duo-lavenderMuted' : 'bg-duo-blush/20 text-duo-blush'}`}>
                                                {m.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-duo-lavenderMuted">
                                            {new Date(m.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => deleteMessage(m.id)}
                                                className="text-red-400 hover:text-red-300 p-2 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-400/10 rounded-lg"
                                                title="Delete Message"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
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
