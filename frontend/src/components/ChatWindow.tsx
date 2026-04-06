import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MoreVertical, Phone, Video, Paperclip, Smile, Image as ImageIcon } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import api from '../api';
import MessageItem from './MessageItem';

const ChatWindow = ({ chat, currentUser }: any) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [typing, setTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const stompRef = useRef<Client | null>(null);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, []);

    const fetchMessages = useCallback(async () => {
        try {
            const res = await api.get(`/messages/chat/${chat.id}`);
            setMessages(res.data.reverse());
            scrollToBottom();
        } catch (err) {
            console.error('Failed to fetch messages', err);
        }
    }, [chat.id, scrollToBottom]);

    useEffect(() => {
        fetchMessages();
        const token = currentUser?.token;
        if (!token) {
            return;
        }
        const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsUrl = import.meta.env.VITE_WS_URL?.trim()
            ? import.meta.env.VITE_WS_URL.trim()
            : `${proto}://${window.location.host}/ws`;

        const client = new Client({
            brokerURL: wsUrl,
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            onConnect: () => {
                client.subscribe(`/topic/chat/${chat.id}`, (payload) => {
                    const message = JSON.parse(payload.body);
                    setMessages((prev) => [...prev, message]);
                    scrollToBottom();
                });

                client.subscribe(`/topic/chat/${chat.id}/typing`, (payload) => {
                    const data = JSON.parse(payload.body);
                    if (data.username !== currentUser.username) {
                        setOtherUserTyping(data.typing ? data.username : null);
                    }
                });

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
        stompRef.current = client;

        return () => {
            client.deactivate();
            stompRef.current = null;
        };
    }, [chat.id, currentUser?.token, currentUser?.username, fetchMessages, scrollToBottom]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        const client = stompRef.current;
        if (!newMessage.trim() || !client?.connected) return;

        const messageDto = {
            chatId: chat.id,
            senderId: currentUser.id,
            content: newMessage,
            type: 'TEXT',
        };

        client.publish({
            destination: '/app/chat.sendMessage',
            body: JSON.stringify(messageDto),
        });

        setNewMessage('');
        handleTyping(false);
    };

    const handleTyping = (isTyping: boolean) => {
        if (typing === isTyping) return;
        setTyping(isTyping);
        const client = stompRef.current;
        if (client?.connected) {
            client.publish({
                destination: '/app/chat.typing',
                body: JSON.stringify({
                    chatId: chat.id,
                    username: currentUser.username,
                    typing: isTyping,
                }),
            });
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-duo-petal border-l border-primary-200/30">
            <div className="px-6 py-3 bg-white/50 backdrop-blur-md border-b border-primary-200/40 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center text-white font-bold shadow-duo-soft">
                        {chat.name?.[0] || 'C'}
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-duo-ink">{chat.name}</h3>
                        <p className="text-[10px] text-primary-600">
                            {otherUserTyping ? `${otherUserTyping} is typing...` : 'Online'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-4 text-duo-ink/45">
                    <button type="button" className="hover:text-primary-500"><Phone size={20} /></button>
                    <button type="button" className="hover:text-primary-500"><Video size={20} /></button>
                    <button type="button" className="hover:text-primary-500"><MoreVertical size={20} /></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, idx) => {
                    const sid = msg.sender?.id ?? msg.senderId;
                    return (
                        <MessageItem
                            key={msg.id || idx}
                            message={msg}
                            isOwn={sid === currentUser.id}
                        />
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white/40 border-t border-primary-200/40">
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <div className="flex gap-2 pb-2 mr-2">
                        <button type="button" className="text-duo-ink/40 hover:text-primary-500"><Paperclip size={20} /></button>
                        <button type="button" className="text-duo-ink/40 hover:text-primary-500"><ImageIcon size={20} /></button>
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
                            className="w-full bg-white/80 border border-primary-200/50 rounded-2xl py-3 pl-4 pr-12 text-sm text-duo-ink placeholder:text-duo-ink/40 focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none max-h-32"
                            rows={1}
                        />
                        <button type="button" className="absolute right-3 bottom-3 text-duo-ink/35 hover:text-primary-500">
                            <Smile size={20} />
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white rounded-xl transition-all shadow-duo-glow"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
