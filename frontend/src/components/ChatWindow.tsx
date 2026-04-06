import { useState, useEffect, useRef } from 'react';
import { Send, MoreVertical, Phone, Video, Paperclip, Smile, Image as ImageIcon } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '../api';
import MessageItem from './MessageItem';

const ChatWindow = ({ chat, currentUser }: any) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const [typing, setTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchMessages();
        setupWebSocket();
        return () => {
            if (stompClient) stompClient.deactivate();
        };
    }, [chat.id]);

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/messages/chat/${chat.id}`);
            setMessages(res.data.reverse());
            scrollToBottom();
        } catch (err) {
            console.error("Failed to fetch messages", err);
        }
    };

    const setupWebSocket = () => {
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            onConnect: () => {
                console.log('Connected to WebSocket');

                // Subscribe to chat topic
                client.subscribe(`/topic/chat/${chat.id}`, (payload) => {
                    const message = JSON.parse(payload.body);
                    setMessages((prev) => [...prev, message]);
                    scrollToBottom();
                });

                // Subscribe to typing indicator
                client.subscribe(`/topic/chat/${chat.id}/typing`, (payload) => {
                    const data = JSON.parse(payload.body);
                    if (data.username !== currentUser.username) {
                        setOtherUserTyping(data.typing ? data.username : null);
                    }
                });

                // For private messages
                client.subscribe('/user/queue/messages', (payload) => {
                    const message = JSON.parse(payload.body);
                    if (message.chatId === chat.id) {
                        setMessages((prev) => [...prev, message]);
                        scrollToBottom();
                    }
                });
            },
        });

        client.activate();
        setStompClient(client);
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !stompClient) return;

        const messageDto = {
            chatId: chat.id,
            senderId: currentUser.id,
            content: newMessage,
            type: 'TEXT'
        };

        stompClient.publish({
            destination: '/app/chat.sendMessage',
            body: JSON.stringify(messageDto)
        });

        setNewMessage('');
        handleTyping(false);
    };

    const handleTyping = (isTyping: boolean) => {
        if (typing === isTyping) return;
        setTyping(isTyping);
        if (stompClient) {
            stompClient.publish({
                destination: '/app/chat.typing',
                body: JSON.stringify({
                    chatId: chat.id,
                    username: currentUser.username,
                    typing: isTyping
                })
            });
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-slate-900 border-l border-slate-800">
            {/* Header */}
            <div className="px-6 py-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                        {chat.name?.[0] || 'C'}
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">{chat.name}</h3>
                        <p className="text-[10px] text-primary-500">
                            {otherUserTyping ? `${otherUserTyping} is typing...` : 'Online'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-4 text-slate-400">
                    <button className="hover:text-primary-400"><Phone size={20} /></button>
                    <button className="hover:text-primary-400"><Video size={20} /></button>
                    <button className="hover:text-primary-400"><MoreVertical size={20} /></button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, idx) => (
                    <MessageItem
                        key={msg.id || idx}
                        message={msg}
                        isOwn={msg.senderId === currentUser.id}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-slate-950/30 border-t border-slate-800">
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <div className="flex gap-2 pb-2 mr-2">
                        <button type="button" className="text-slate-500 hover:text-primary-400"><Paperclip size={20} /></button>
                        <button type="button" className="text-slate-500 hover:text-primary-400"><ImageIcon size={20} /></button>
                    </div>

                    <div className="flex-1 relative">
                        <textarea
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                handleTyping(e.target.value.length > 0);
                            }}
                            onBlur={() => handleTyping(false)}
                            placeholder="Type a message..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none max-h-32"
                            rows={1}
                        />
                        <button type="button" className="absolute right-3 bottom-3 text-slate-500 hover:text-yellow-500">
                            <Smile size={20} />
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="p-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-colors shadow-lg shadow-primary-900/20"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
