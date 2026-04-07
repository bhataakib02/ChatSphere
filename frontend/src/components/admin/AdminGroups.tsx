import { useState, useEffect } from 'react';
import api from '../../api';

export const AdminGroups = () => {
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchChats();
    }, []);

    const fetchChats = async () => {
        try {
            const res = await api.get('/admin/chats');
            setChats(res.data);
        } catch {
            console.error("Failed to fetch chats");
        } finally {
            setLoading(false);
        }
    };

    const disbandGroup = async (chatId: number) => {
        if (!confirm("Are you SURE you want to disband this group? This action is irreversible.")) return;
        try {
            await api.delete(`/admin/chats/${chatId}`);
            setChats(chats.filter(c => c.id !== chatId));
        } catch {
            alert("Failed to disband group.");
        }
    };

    const filteredChats = chats.filter(c =>
        (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
        c.id.toString().includes(search)
    );

    return (
        <div className="relative z-10 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">Group Control</h1>
                    <p className="text-duo-lavenderMuted">Monitor active chat rooms and disband malicious groups.</p>
                </div>
                <div className="relative">
                    <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-duo-lavenderMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input
                        type="text"
                        placeholder="Filter groups..."
                        className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary-500/50 w-64 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center animate-pulse">Scanning network...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredChats.map(chat => (
                        <div key={chat.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group relative overflow-hidden">
                            {!chat.isGroup && <div className="absolute top-0 right-0 bg-primary-500/20 text-primary-400 text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-tighter">Direct Message</div>}

                            <h3 className="text-lg font-bold text-white mb-1 truncate">{chat.name || 'Unnamed Chat'}</h3>
                            <p className="text-xs text-duo-lavenderMuted font-mono mb-4">ID: #{chat.id}</p>

                            <div className="flex items-center space-x-4 mb-6">
                                <div className="flex -space-x-2">
                                    {(chat.participants || []).slice(0, 3).map((p: any, i: number) => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-duo-voidDeep bg-primary-500/20 text-primary-300 flex items-center justify-center text-[10px] font-bold">
                                            {p.username.charAt(0).toUpperCase()}
                                        </div>
                                    ))}
                                    {chat.participants?.length > 3 && (
                                        <div className="w-8 h-8 rounded-full border-2 border-duo-voidDeep bg-white/10 text-white flex items-center justify-center text-[10px] font-bold">
                                            +{chat.participants.length - 3}
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs text-duo-mist font-medium">{chat.participants?.length || 0} Members</span>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                <span className="text-[10px] text-duo-lavenderMuted font-mono">Created: {new Date(chat.createdAt).toLocaleDateString()}</span>
                                <button
                                    onClick={() => disbandGroup(chat.id)}
                                    className="text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    Disband
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
