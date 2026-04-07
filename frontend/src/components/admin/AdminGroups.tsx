import { useState, useEffect } from 'react';
import api from '../../api';

export const AdminGroups = () => {
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
    const [groupMembers, setGroupMembers] = useState<any[]>([]);

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

    const fetchGroupDetails = async (chat: any) => {
        setSelectedGroup(chat);
        setGroupMembers([]);
        try {
            const res = await api.get(`/admin/groups/${chat.id}/members`);
            setGroupMembers(res.data);
        } catch {
            console.error("Failed to fetch members");
        }
    };

    const disbandGroup = async (chatId: number) => {
        if (!confirm("Are you SURE you want to disband this group? This action is irreversible.")) return;
        try {
            await api.delete(`/admin/chats/${chatId}`);
            setChats(prev => prev.filter(c => c.id !== chatId));
            if (selectedGroup?.id === chatId) setSelectedGroup(null);
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
                    <p className="text-duo-lavenderMuted text-sm">Monitor active chat rooms and disband malicious groups.</p>
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
                <div className="py-20 text-center animate-pulse text-duo-lavenderMuted italic">Scanning network...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredChats.map(chat => (
                        <div key={chat.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group relative overflow-hidden text-left">
                            {!chat.isGroup && <div className="absolute top-0 right-0 bg-primary-500/20 text-primary-400 text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-tighter">Direct Message</div>}

                            <h3 className="text-lg font-bold text-white mb-1 truncate">{chat.name || 'Unnamed Chat'}</h3>
                            <p className="text-xs text-duo-lavenderMuted font-mono mb-4">ID: #{chat.id}</p>

                            <div className="flex items-center space-x-4 mb-6">
                                <div className="flex -space-x-2">
                                    {(chat.participants || []).slice(0, 3).map((p: any, i: number) => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-duo-voidDeep bg-primary-500/20 text-primary-300 flex items-center justify-center text-[10px] font-bold">
                                            {p.username?.charAt(0).toUpperCase() || '?'}
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
                                <button
                                    onClick={() => fetchGroupDetails(chat)}
                                    className="text-primary-400 hover:text-primary-300 text-xs font-bold uppercase tracking-wider transition-colors"
                                >
                                    Auditing
                                </button>
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

            {/* Member List Modal */}
            {selectedGroup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-duo-voidDeep/95 border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl relative text-left">
                        <button onClick={() => setSelectedGroup(null)} className="absolute top-6 right-6 text-duo-lavenderMuted hover:text-white transition-all">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>

                        <h2 className="text-2xl font-black text-white mb-1">Group Audit</h2>
                        <p className="text-sm text-duo-lavenderMuted mb-6 italic">#{selectedGroup.id} - {selectedGroup.name}</p>

                        <div className="max-h-80 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {groupMembers.length === 0 ? (
                                <div className="text-center py-10 text-duo-lavenderMuted animate-pulse">Scanning participants...</div>
                            ) : (
                                groupMembers.map(m => (
                                    <div key={m.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-primary-500/20 text-primary-300 rounded-full flex items-center justify-center font-black text-sm">
                                                {m.username?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <div className="text-white font-bold">{m.username}</div>
                                                <div className="text-[10px] text-duo-lavenderMuted font-mono">ID: {m.id}</div>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest ${m.role === 'ROLE_SUPER_ADMIN' ? 'bg-violet-500/20 text-violet-300' : 'bg-primary-500/20 text-primary-300'}`}>
                                            {m.role?.replace('ROLE_', '')}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5">
                            <button
                                onClick={() => disbandGroup(selectedGroup.id)}
                                className="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-3 rounded-xl font-bold transition-all border border-red-500/30 shadow-lg shadow-red-500/10"
                            >
                                DISBAND THIS ROOM
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
