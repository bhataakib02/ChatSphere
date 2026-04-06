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
        <div className="w-80 flex flex-col bg-slate-900 border-r border-slate-800">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <h1 className="text-xl font-bold text-white">ChatSphere</h1>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                        <Plus size={20} />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="px-4 mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800">
                <button className="flex-1 py-2 text-xs font-semibold text-primary-500 border-b-2 border-primary-500">Chats</button>
                <button className="flex-1 py-2 text-xs font-semibold text-slate-500 hover:text-slate-300">Groups</button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
                {chats.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        No conversations yet.
                    </div>
                ) : (
                    chats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => onSelectChat(chat)}
                            className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${selectedChat?.id === chat.id ? 'bg-slate-800' : 'hover:bg-slate-800/50'
                                }`}
                        >
                            <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-lg">
                                {chat.name?.[0] || 'C'}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="text-sm font-semibold text-white truncate">{chat.name}</h3>
                                    <span className="text-[10px] text-slate-500">12:30 PM</span>
                                </div>
                                <p className="text-xs text-slate-500 truncate">No messages yet...</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Profile */}
            <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                    {currentUser?.username?.[0].toUpperCase()}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-white">{currentUser?.username}</p>
                    <p className="text-[10px] text-primary-500">Online</p>
                </div>
                <button className="text-slate-500 hover:text-white">
                    <Settings size={18} />
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
