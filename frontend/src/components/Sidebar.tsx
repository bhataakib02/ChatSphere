import { useState, useEffect } from 'react';
import { Search, Plus, Settings, LogOut } from 'lucide-react';
import api from '../api';

const Sidebar = ({ selectedChat, onSelectChat, currentUser }: any) => {
    const [chats, setChats] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (currentUser) {
            fetchChats();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when currentUser reference changes only
    }, [currentUser]);

    const fetchChats = async () => {
        try {
            const res = await api.get(`/chats/user/${currentUser.id}`);
            setChats(res.data);
        } catch (err) {
            console.error("Failed to fetch chats", err);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.reload();
    };

    return (
        <div className="w-80 flex flex-col bg-duo-void border-r border-white/10">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <h1 className="text-xl font-bold text-white">ChatSphare</h1>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-lg text-duo-lavenderMuted transition-colors">
                        <Plus size={20} />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="p-2 hover:bg-primary-500/10 rounded-lg text-duo-lavenderMuted hover:text-primary-400 transition-colors"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="px-4 mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-duo-lavenderMuted/80" />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-duo-voidDeep border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-duo-mist focus:outline-none focus:ring-1 focus:ring-primary-400"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
                <button className="flex-1 py-2 text-xs font-semibold text-primary-400 border-b-2 border-primary-500">Chats</button>
                <button className="flex-1 py-2 text-xs font-semibold text-duo-lavenderMuted/70 hover:text-duo-mist">Groups</button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
                {chats.length === 0 ? (
                    <div className="p-8 text-center text-duo-lavenderMuted/80 text-sm">
                        No conversations yet.
                    </div>
                ) : (
                    chats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => onSelectChat(chat)}
                            className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${selectedChat?.id === chat.id ? 'bg-white/10' : 'hover:bg-white/5'
                                }`}
                        >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center text-white font-bold text-lg shadow-duo-soft">
                                {chat.name?.[0] || 'C'}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="text-sm font-semibold text-white truncate">{chat.name}</h3>
                                    <span className="text-[10px] text-duo-lavenderMuted/70">12:30 PM</span>
                                </div>
                                <p className="text-xs text-duo-lavenderMuted/70 truncate">No messages yet...</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Profile */}
            <div className="p-4 bg-duo-voidDeep/80 border-t border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-duo-mist">
                    {currentUser?.username?.[0].toUpperCase()}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-white">{currentUser?.username}</p>
                    <p className="text-[10px] text-primary-400">Online</p>
                </div>
                <button className="text-duo-lavenderMuted hover:text-duo-mist">
                    <Settings size={18} />
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
