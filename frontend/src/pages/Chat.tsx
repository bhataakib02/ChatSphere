import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';

const Chat = () => {
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    return (
        <div className="h-screen flex bg-slate-950 overflow-hidden">
            <Sidebar
                selectedChat={selectedChat}
                onSelectChat={setSelectedChat}
                currentUser={user}
            />

            {selectedChat ? (
                <ChatWindow
                    chat={selectedChat}
                    currentUser={user}
                />
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-slate-900/50">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-white">Select a chat to start messaging</h2>
                    <p className="text-sm">Search for users or groups from the sidebar</p>
                </div>
            )}
        </div>
    );
};

export default Chat;
