import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import AuthService from '../services/auth.service';
import ChatService from '../services/chat.service';
import ContactService from '../services/contact.service';
import MessageService from '../services/message.service';
import api from '../api';
import { useNotification } from '../context/NotificationContext';

const Dashboard = () => {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [chats, setChats] = useState<any[]>([]);
    const [activeChat, setActiveChat] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isConnected, setIsConnected] = useState(false);

    // UI elements
    const [showSidebar, setShowSidebar] = useState(true);
    const [showAttachMenu, setShowAttachMenu] = useState(false);

    // Media & Files
    const [isUploading, setIsUploading] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);

    // Audio Voice Memos
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<any>(null);

    // Typing Indicators
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const typingTimeoutRef = useRef<any>(null);

    // Group Creation
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);

    const [showAddContactModal, setShowAddContactModal] = useState(false);
    const [showRequestsModal, setShowRequestsModal] = useState(false);
    const [addSearchQuery, setAddSearchQuery] = useState('');
    const [addSearchResults, setAddSearchResults] = useState<any[]>([]);
    const [addSearchLoading, setAddSearchLoading] = useState(false);
    const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
    const [incomingCount, setIncomingCount] = useState(0);
    const [requestsTab, setRequestsTab] = useState<'incoming' | 'outgoing'>('incoming');

    // Profile Settings
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [bio, setBio] = useState("");
    const [profileUsername, setProfileUsername] = useState("");
    const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const profilePhotoInputRef = useRef<HTMLInputElement>(null);

    // Search (setters reserved for future UI wiring)
    const [userSearchTerm] = useState("");
    const [msgSearchTerm] = useState("");

    // Media Preview
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [fileCaption, setFileCaption] = useState("");

    // Threading
    const [replyingTo, setReplyingTo] = useState<any>(null);

    const stompClientRef = useRef<Client | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const activeChatRef = useRef<any>(null);

    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (!user) {
            navigate("/login");
        } else {
            setCurrentUser(user);
            setBio(user.bio || "");
            setProfileUsername(user.username || "");
            fetchInitialData(user.id);
            connectWebSocket(user.token);
            ensureE2EEKeys(user);
        }

        return () => {
            if (stompClientRef.current) stompClientRef.current.deactivate();
            cancelRecording();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- session bootstrap; cancelRecording stable for teardown intent
    }, [navigate]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const fetchInitialData = async (userId: number) => {
        try {
            const [contactsRes, chatsRes, incomingRes] = await Promise.all([
                ContactService.getContacts(),
                ChatService.getUserChats(userId),
                ContactService.getIncomingRequests(),
            ]);
            setUsers(contactsRes.data);
            setChats(chatsRes.data);
            setIncomingCount(incomingRes.data?.length ?? 0);
        } catch (error) {
            console.error("Fetch data error", error);
        }
    };

    const loadContactsOnly = async () => {
        try {
            const contactsRes = await ContactService.getContacts();
            setUsers(contactsRes.data);
        } catch (e) {
            console.error(e);
        }
    };

    const loadRequests = async () => {
        try {
            const [inc, out] = await Promise.all([
                ContactService.getIncomingRequests(),
                ContactService.getOutgoingRequests(),
            ]);
            setIncomingRequests(inc.data);
            setOutgoingRequests(out.data);
            setIncomingCount(inc.data.length);
        } catch (e) {
            console.error(e);
        }
    };

    const runAddSearch = async () => {
        const q = addSearchQuery.trim();
        if (q.length < 2) {
            showNotification('Type at least 2 characters.', 'info');
            return;
        }
        setAddSearchLoading(true);
        try {
            const res = await ContactService.searchForAdd(q);
            setAddSearchResults(res.data);
        } catch {
            setAddSearchResults([]);
        } finally {
            setAddSearchLoading(false);
        }
    };

    const handleSendContactRequest = async (receiverId: number) => {
        try {
            await ContactService.sendRequest(receiverId);
            showNotification('Request sent.', 'success');
            setAddSearchResults(prev => prev.filter((u: any) => u.id !== receiverId));
            await loadRequests();
        } catch (e: any) {
            const msg = e.response?.data?.message || e.response?.data?.error || 'Could not send request.';
            showNotification(typeof msg === 'string' ? msg : 'Could not send request.', 'error');
        }
    };

    const handleAcceptRequest = async (requestId: number) => {
        try {
            const res = await ContactService.acceptRequest(requestId);
            const chat = res.data;
            setChats((prev) => (prev.some((c) => c.id === chat.id) ? prev : [chat, ...prev]));
            // Important: Load both so the "YOUR CONTACTS" list refreshes
            await loadContactsOnly();
            await loadRequests();
            showNotification('Contact added to Duo Space!', 'success');
        } catch (e: any) {
            const msg = e.response?.data?.message || 'Action failed.';
            showNotification(msg, 'error');
        }
    };

    const handleRejectRequest = async (requestId: number) => {
        try {
            await ContactService.rejectRequest(requestId);
            await loadRequests();
            showNotification("Request rejected", "info");
        } catch {
            showNotification("Could not reject request", "error");
        }
    };

    const handleCancelOutgoing = async (requestId: number) => {
        try {
            await ContactService.cancelRequest(requestId);
            await loadRequests();
        } catch {
            showNotification('Could not cancel request.', 'error');
        }
    };

    const connectWebSocket = (token: string) => {
        const wsUrl = import.meta.env.VITE_WS_URL?.trim()
            ? import.meta.env.VITE_WS_URL.trim()
            : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

        const stompClient = new Client({
            brokerURL: wsUrl,
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
        });

        stompClient.onConnect = () => {
            setIsConnected(true);
            stompClient.subscribe('/topic/users/status', (message) => {
                const statusUpdate = JSON.parse(message.body);
                setUsers(prev => prev.map(u =>
                    u.id === statusUpdate.userId ? { ...u, online: statusUpdate.online, lastSeen: statusUpdate.lastSeen } : u
                ));
            });

            stompClient.subscribe('/topic/announcements', (message) => {
                const announcement = JSON.parse(message.body);
                showNotification(`📢 SYSTEM: ${announcement.content}`, 'info');
            });

            // Personal notifications topic (for background message delivery)
            stompClient.subscribe(`/queue/user/${currentUser.id}/notifications`, (message) => {
                const msg = JSON.parse(message.body);
                if (activeChatRef.current?.id !== msg.chatId) {
                    // Update chat list to show unread count or move to top
                    setChats(prev => {
                        const existing = prev.find(c => c.id === msg.chatId);
                        if (existing) {
                            return [existing, ...prev.filter(c => c.id !== msg.chatId)];
                        }
                        return prev;
                    });
                }
            });
        };

        stompClient.onWebSocketClose = () => setIsConnected(false);

        stompClient.activate();
        stompClientRef.current = stompClient;
    };


    const handleIncomingMessage = async (msg: any) => {
        if (msg.encrypted && msg.content) {
            // If I am the recipient or sender, attempt decryption
            // (Note: In pure RSA 1-on-1, sender can't decrypt unless double encrypted. For demo, we assume receiving side)
            if (msg.sender?.id !== currentUser.id) {
                msg.content = await decryptText(msg.content, currentUser.id);
            } else {
                // For sender, since it's locally sent, they know what they sent. 
                // But if they refresh, they see cipher. Ideally we'd store a local cleartext cache.
            }
        }
        setMessages(prev => {
            if (!prev.find(m => m.id === msg.id)) {
                return [...prev, msg];
            }
            return prev;
        });
    };

    const selectChat = async (chat: any) => {
        setActiveChat(chat);
        setShowSidebar(false);
        try {
            const res = await MessageService.getChatMessages(chat.id);
            // Pre-decrypt messages
            const decryptedMessages = await Promise.all(res.data.map(async (msg: any) => {
                if (msg.encrypted && msg.sender?.id !== currentUser.id) {
                    return { ...msg, content: await decryptText(msg.content, currentUser.id) };
                }
                return msg;
            }));
            setMessages(decryptedMessages);

            if (stompClientRef.current && stompClientRef.current.connected) {
                // Main chat messages
                stompClientRef.current.subscribe(`/topic/chat/${chat.id}`, (message) => {
                    const msg = JSON.parse(message.body);
                    handleIncomingMessage(msg);
                });

                // Typing indicators
                stompClientRef.current.subscribe(`/topic/chat/${chat.id}/typing`, (message) => {
                    const payload = JSON.parse(message.body);
                    if (payload.username === currentUser.username) return;

                    setTypingUsers(prev => {
                        const newSet = new Set(prev);
                        if (payload.typing) {
                            newSet.add(payload.username);
                        } else {
                            newSet.delete(payload.username);
                        }
                        return newSet;
                    });
                });

                // Read Receipts
                stompClientRef.current.subscribe(`/topic/chat/${chat.id}/read`, (message) => {
                    const payload = JSON.parse(message.body);
                    if (payload.readerId !== currentUser.id) {
                        setMessages(prev => prev.map(m =>
                            m.sender.id !== payload.readerId ? { ...m, status: 'READ' } : m
                        ));
                    }
                });

                // Auto-mark as read
                stompClientRef.current.publish({
                    destination: '/app/chat.markRead',
                    body: JSON.stringify({ chatId: chat.id, readerId: currentUser.id })
                });

                // Reactions subscription
                stompClientRef.current.subscribe(`/topic/chat/${chat.id}/reaction`, (message) => {
                    const payload = JSON.parse(message.body);
                    setMessages(prev => prev.map(m => {
                        if (m.id === payload.messageId) {
                            const newReactions = { ...m.reactions };
                            if (payload.reaction === "" || !payload.reaction) {
                                delete newReactions[payload.userId];
                            } else {
                                newReactions[payload.userId] = payload.reaction;
                            }
                            return { ...m, reactions: newReactions };
                        }
                        return m;
                    }));
                });
            }
        } catch (error) {
            console.error("Failed to load history", error);
        }
    };

    const startChat = async (targetUser: any) => {
        const existingChat = chats.find(c =>
            !c.isGroup && c.participants.some((p: any) => p.id === targetUser.id)
        );

        if (existingChat) {
            selectChat(existingChat);
            return;
        }

        try {
            const res = await ChatService.createChat(
                `${currentUser.username} & ${targetUser.username}`,
                false,
                [currentUser.id, targetUser.id]
            );
            setChats(prev => [...prev, res.data]);
            selectChat(res.data);
        } catch (error) {
            console.error("Failed to create chat", error);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) {
            showNotification("Please provide a group name and select at least one member.", "info");
            return;
        }

        setIsCreatingGroup(true);
        try {
            const res = await ChatService.createChat(
                groupName,
                true,
                [currentUser.id, ...selectedUsers]
            );
            const newChat = res.data;
            setChats(prev => [newChat, ...prev]);
            selectChat(newChat);
            setShowGroupModal(false);
            setGroupName("");
            setSelectedUsers([]);
        } catch {
            showNotification("Failed to create group.", "error");
        } finally {
            setIsCreatingGroup(false);
        }
    };

    const toggleUserSelection = (userId: number) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        setFileCaption("");

        if (file.type.startsWith('image/')) {
            compressImage(file).then(compressedFile => {
                setSelectedFile(compressedFile);
                const reader = new FileReader();
                reader.onload = (ev) => setFilePreview(ev.target?.result as string);
                reader.readAsDataURL(compressedFile);
            });
        } else if (file.type.startsWith('video/')) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => setFilePreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setSelectedFile(file);
            setFilePreview(null);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile || !activeChat) return;

        setIsUploading(true);
        try {
            const res = await MessageService.uploadFile(selectedFile);
            const fileUrl = res.data.fileUrl;

            const type = selectedFile.type.startsWith('image/') ? 'IMAGE' :
                selectedFile.type.startsWith('video/') ? 'VIDEO' :
                    selectedFile.type.startsWith('audio/') ? 'AUDIO' : 'FILE';

            const chatMessage = {
                chatId: activeChat.id,
                senderId: currentUser.id,
                content: fileCaption || selectedFile.name,
                type: type,
                fileUrl: fileUrl
            };

            stompClientRef.current?.publish({
                destination: '/app/chat.sendMessage',
                body: JSON.stringify(chatMessage),
            });

            // Cleanup
            setSelectedFile(null);
            setFilePreview(null);
            setFileCaption("");
            showNotification("File shared successfully", "success");
        } catch {
            showNotification("File upload failed!", "error");
        } finally {
            setIsUploading(false);
            if (imageInputRef.current) imageInputRef.current.value = "";
            if (docInputRef.current) docInputRef.current.value = "";
        }
    };

    const sendMessage = async (e?: React.FormEvent | React.KeyboardEvent) => {
        if (e) e.preventDefault();

        if (!newMessage.trim() || !activeChat || !isConnected) return;

        let contentToSend = newMessage;
        let isEncrypted = false;

        const otherParticipant = !activeChat.isGroup ? activeChat.participants.find((p: any) => p.id !== currentUser.id) : null;
        if (otherParticipant && otherParticipant.publicKey) {
            // Check if we also have our own key to encrypt for ourselves (optional in simple RSA logic, usually double-encrypted)
            // For this demo, we'll encrypt strictly for recipient.
            contentToSend = await encryptText(newMessage, otherParticipant.publicKey);
            isEncrypted = true;
        }

        const chatMessage = {
            chatId: activeChat.id,
            senderId: currentUser.id,
            content: contentToSend,
            type: "TEXT",
            parentMessageId: replyingTo?.id,
            encrypted: isEncrypted
        };

        stompClientRef.current?.publish({
            destination: '/app/chat.sendMessage',
            body: JSON.stringify(chatMessage),
        });

        setNewMessage("");
        setReplyingTo(null);
        sendTypingStatus(false);
    };

    const sendTypingStatus = (typing: boolean) => {
        if (!activeChat || !isConnected || !stompClientRef.current?.connected) return;

        stompClientRef.current.publish({
            destination: '/app/chat.typing',
            body: JSON.stringify({
                chatId: activeChat.id,
                username: currentUser.username,
                typing: typing
            })
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setNewMessage(value);

        if (!activeChat) return;

        // If not already typing, send event
        if (value.trim().length > 0 && !typingTimeoutRef.current) {
            sendTypingStatus(true);
        }

        // Reset timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            sendTypingStatus(false);
            typingTimeoutRef.current = null;
        }, 2000);
    };

    // ----- VOICE MEMO LOGIC -----
    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const startRecording = async () => {
        if (!activeChat) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());

                const audioFile = new File([audioBlob], `VoiceNote_${Date.now()}.webm`, { type: 'audio/webm' });

                setIsUploading(true);
                try {
                    const res = await MessageService.uploadFile(audioFile);
                    const chatMessage = {
                        chatId: activeChat.id,
                        senderId: currentUser.id,
                        content: formatTime(recordingTime),
                        type: "AUDIO",
                        fileUrl: res.data.fileUrl
                    };
                    stompClientRef.current?.publish({
                        destination: '/app/chat.sendMessage',
                        body: JSON.stringify(chatMessage),
                    });
                } catch {
                    showNotification("Voice message failed.", "error");
                } finally {
                    setIsUploading(false);
                }
                setRecordingTime(0);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error(error);
            showNotification("Microphone permission denied.", "error");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.onstop = null; // Disable sending
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
            setIsRecording(false);
            setRecordingTime(0);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            audioChunksRef.current = [];
        }
    };

    const handleLogout = () => {
        AuthService.logout();
        navigate("/login");
    };

    const encryptText = async (text: string, recipientPubKeyBase64: string) => {
        try {
            const binaryDerString = window.atob(recipientPubKeyBase64);
            const binaryDer = new Uint8Array(binaryDerString.length);
            for (let i = 0; i < binaryDerString.length; i++) binaryDer[i] = binaryDerString.charCodeAt(i);

            const publicKey = await window.crypto.subtle.importKey(
                "spki",
                binaryDer.buffer,
                { name: "RSA-OAEP", hash: "SHA-256" },
                true,
                ["encrypt"]
            );

            const encoded = new TextEncoder().encode(text);
            const encrypted = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, encoded);
            return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
        } catch (e) {
            console.error("Encryption failed", e);
            return text;
        }
    };

    const decryptText = async (encryptedBase64: string, userId: number) => {
        try {
            const keysStr = localStorage.getItem(`chat_keys_${userId}`);
            if (!keysStr) return "[Keys Missing]";
            const { privateKey: privateKeyBase64 } = JSON.parse(keysStr);

            const binaryDerString = window.atob(privateKeyBase64);
            const binaryDer = new Uint8Array(binaryDerString.length);
            for (let i = 0; i < binaryDerString.length; i++) binaryDer[i] = binaryDerString.charCodeAt(i);

            const privateKey = await window.crypto.subtle.importKey(
                "pkcs8",
                binaryDer.buffer,
                { name: "RSA-OAEP", hash: "SHA-256" },
                true,
                ["decrypt"]
            );

            const encryptedBinary = window.atob(encryptedBase64);
            const encryptedData = new Uint8Array(encryptedBinary.length);
            for (let i = 0; i < encryptedBinary.length; i++) encryptedData[i] = encryptedBinary.charCodeAt(i);

            const decrypted = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, encryptedData);
            return new TextDecoder().decode(decrypted);
        } catch (e) {
            console.error("Decryption failed", e);
            return "[Encrypted Message]";
        }
    };

    const compressImage = async (file: File): Promise<File> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const MAX_WIDTH = 1280;
                    const MAX_HEIGHT = 1280;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: "image/jpeg",
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    }, "image/jpeg", 0.7);
                };
            };
        });
    };

    const ensureE2EEKeys = async (user: any) => {
        const storedKeys = localStorage.getItem(`chat_keys_${user.id}`);
        if (storedKeys) return;

        console.log("Generating E2EE keys...");
        try {
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: "RSA-OAEP",
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: "SHA-256",
                },
                true,
                ["encrypt", "decrypt"]
            );

            const publicKeyBuf = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
            const privateKeyBuf = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

            const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuf)));
            const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuf)));

            localStorage.setItem(`chat_keys_${user.id}`, JSON.stringify({
                publicKey: publicKeyBase64,
                privateKey: privateKeyBase64
            }));

            // Sync public key to backend
            await api.put(`/users/${user.id}`, {
                ...user,
                publicKey: publicKeyBase64
            });
            console.log("E2EE keys synced.");
        } catch (err) {
            console.error("Encryption error", err);
        }
    };

    const handleProfilePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const compressedFile = await compressImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfilePhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
    };

    const handleUpdateProfile = async () => {
        setIsUpdatingProfile(true);
        try {
            const updatePayload: any = {
                username: profileUsername.trim() || currentUser.username,
                email: currentUser.email,
                bio: bio,
            };
            if (profilePhotoPreview) {
                updatePayload.profilePicture = profilePhotoPreview;
                updatePayload.profilePhoto = profilePhotoPreview;
            }
            const res = await api.put(`/users/${currentUser.id}`, updatePayload);
            const updatedUser = res.data;
            setCurrentUser({ ...currentUser, ...updatedUser });
            setProfileUsername(updatedUser.username);
            // Update local storage too
            const stored = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...stored, bio: bio, username: updatedUser.username, profilePicture: updatedUser.profilePicture }));
            setProfilePhotoPreview(null);
            setShowSettingsModal(false);
        } catch (err: any) {
            console.error("Profile update failed:", err?.response?.data || err);
            showNotification("Update failed: " + (err?.response?.data?.message || "Error"), "error");
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleReaction = (messageId: number, emoji: string) => {
        if (!stompClientRef.current || !activeChat) return;

        stompClientRef.current.publish({
            destination: '/app/chat.react',
            body: JSON.stringify({
                messageId,
                userId: currentUser.id,
                reaction: emoji,
                chatId: activeChat.id
            })
        });
    };

    if (!currentUser) return null;

    return (
        <div className="flex h-[100dvh] bg-[#fff0f3] font-sans text-gray-900 overflow-hidden relative" onClick={() => showAttachMenu && setShowAttachMenu(false)}>

            {/* Sidebar */}
            <div className={`w-full md:w-80 lg:w-96 border-r border-white/60 flex flex-col glass-morphism z-20 transition-all duration-300 absolute md:relative h-full ${!showSidebar ? '-translate-x-full md:translate-x-0' : 'translate-x-0'
                }`}>
                <div className="p-4 md:p-6 border-b border-white/60 flex justify-between items-center">
                    <h2 className="text-xl md:text-2xl font-black text-gradient tracking-tight cursor-pointer">
                        Duo Space
                    </h2>
                    <div className="flex items-center space-x-2">
                        {currentUser.role === 'ROLE_SUPER_ADMIN' && (
                            <button onClick={() => navigate("/admin")} className="text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition-all duration-200 uppercase tracking-widest">
                                ADMIN
                            </button>
                        )}
                        <button onClick={handleLogout} className="text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-200 uppercase tracking-widest border border-rose-500/20">
                            Logout
                        </button>
                    </div>
                </div>

                <div className="px-4 py-3 bg-white/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ff4d6d] to-[#ff85a1] flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-[#ff4d6d]/20 relative group">
                            {currentUser.username[0].toUpperCase()}
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[#ff4d6d] shadow-sm">
                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0 mx-3">
                            <h2 className="text-sm font-black text-rose-900 tracking-tight truncate">{currentUser.username}</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest flex items-center mt-1">
                                <span className={`w-2 h-2 rounded-full mr-1.5 ${isConnected ? 'bg-[#ff4d6d] shadow-[0_0_8px_rgba(255,77,109,0.5)]' : 'bg-gray-300'} animate-pulse`}></span>
                                <span className={isConnected ? "text-[#ff4d6d]" : "text-gray-400"}>{isConnected ? 'LIVE' : 'SYNCING'}</span>
                            </p>
                        </div>
                        <button
                            onClick={() => setShowSettingsModal(true)}
                            className="p-2 rounded-xl bg-white/60 text-rose-400 hover:text-rose-600 transition-all border border-rose-100 shrink-0"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                    </div>

                    <div className="relative mb-6">
                        <input type="text" placeholder="Search memories..."
                            className="w-full bg-white/60 border border-rose-100 rounded-2xl py-3 pl-12 pr-4 text-rose-900 placeholder-rose-300 focus:outline-none focus:ring-4 focus:ring-[#ff4d6d]/10 focus:border-[#ff4d6d]/40 transition-all font-medium" />
                        <svg className="w-5 h-5 absolute left-4 top-3.5 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>

                    <div className="flex gap-2 mb-2">
                        <button
                            type="button"
                            onClick={() => { setShowAddContactModal(true); setAddSearchQuery(''); setAddSearchResults([]); }}
                            className="flex-1 py-2.5 rounded-xl bg-white/70 border border-rose-200 text-rose-600 text-[10px] font-black uppercase tracking-widest hover:bg-[#ff4d6d]/10 transition-all"
                        >
                            Add contact
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowRequestsModal(true); loadRequests(); }}
                            className="flex-1 py-2.5 rounded-xl bg-white/70 border border-rose-200 text-rose-600 text-[10px] font-black uppercase tracking-widest hover:bg-[#ff4d6d]/10 transition-all relative"
                        >
                            Requests
                            {incomingCount > 0 ? (
                                <span className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-[#ff4d6d] text-white text-[9px] font-black">
                                    {incomingCount}
                                </span>
                            ) : null}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
                    {/* Active Chats */}
                    <div className="px-2 mb-2">
                        <button
                            onClick={() => setShowGroupModal(true)}
                            className="w-full flex items-center justify-center space-x-2 py-3 bg-[#ff4d6d]/10 hover:bg-[#ff4d6d]/20 text-[#ff4d6d] rounded-2xl border border-[#ff4d6d]/20 transition-all font-black text-xs tracking-widest shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                            <span>CREATE SHARED SPACE</span>
                        </button>
                    </div>

                    <div>
                        <div className="px-3 text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3">Recent Chats</div>
                        {chats.filter(c => {
                            const otherParticipants = c.participants.filter((p: any) => p.id !== currentUser.id);
                            const displayName = c.isGroup ? c.name : otherParticipants.map((p: any) => p.username).join(", ");
                            return displayName.toLowerCase().includes(userSearchTerm.toLowerCase());
                        }).length === 0 ? (
                            <div className="p-3 text-xs text-primary-900/35 italic text-center">No matching chats</div>
                        ) : (
                            <div className="space-y-0.5">
                                {chats.filter(c => {
                                    const otherParticipants = c.participants.filter((p: any) => p.id !== currentUser.id);
                                    const displayName = c.isGroup ? c.name : otherParticipants.map((p: any) => p.username).join(", ");
                                    return displayName.toLowerCase().includes(userSearchTerm.toLowerCase());
                                }).map(chat => {
                                    const otherParticipants = chat.participants.filter((p: any) => p.id !== currentUser.id);
                                    const displayName = chat.isGroup ? chat.name : otherParticipants.map((p: any) => p.username).join(", ");
                                    const isActive = activeChat?.id === chat.id;

                                    return (
                                        <div key={chat.id} onClick={() => selectChat(chat)}
                                            className={`p-4 rounded-[2rem] cursor-pointer transition-all duration-300 border-2 group mb-2 ${isActive
                                                ? 'bg-white/60 border-[#ff4d6d]/30 shadow-lg shadow-[#ff4d6d]/5'
                                                : 'border-transparent hover:bg-white/40'
                                                }`}>
                                            <div className="flex items-center space-x-4">
                                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 transition-all duration-500 shadow-md ${isActive ? 'bg-gradient-to-tr from-[#ff4d6d] to-[#ff85a1] text-white scale-105 rotate-3' : 'bg-white/40 text-gray-600 group-hover:scale-105'}`}>
                                                    {displayName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`font-black text-sm truncate tracking-tight ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                                                        {displayName}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold group-hover:text-[#ff4d6d] transition-colors">Shared Duo Space</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-rose-200/50 mx-4"></div>

                    {/* Contacts only — use Add contact to send a request */}
                    <div>
                        <div className="px-3 text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3">Your contacts</div>
                        <div className="space-y-0.5">
                            {users.filter(u => u.username.toLowerCase().includes(userSearchTerm.toLowerCase())).length === 0 ? (
                                <div className="px-3 py-4 text-xs text-primary-900/40 text-center font-medium leading-relaxed">
                                    No contacts yet. Use <span className="font-black text-rose-500">Add contact</span> to find someone by username or email and send a request.
                                </div>
                            ) : (
                                users.filter(u => u.username.toLowerCase().includes(userSearchTerm.toLowerCase())).map(user => (
                                    <div key={user.id} onClick={() => startChat(user)}
                                        className="p-3 flex items-center space-x-3 rounded-2xl hover:bg-white/40 cursor-pointer transition-all border border-transparent group">
                                        <div className="h-9 w-9 rounded-[1rem] bg-rose-50 text-rose-500 flex items-center justify-center font-black text-xs border border-rose-100 group-hover:bg-[#ff4d6d] group-hover:text-white transition-all shrink-0 relative">
                                            {user.username.charAt(0).toUpperCase()}
                                            {user.online && (
                                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#c0ca33] border-2 border-white rounded-full shadow-sm"></span>
                                            )}
                                        </div>
                                        <div className="font-black text-rose-900 text-sm flex-1 truncate">{user.username}</div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-rose-500/10 p-1.5 rounded-full">
                                            <svg className="w-4 h-4 text-[#ff4d6d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-[#fff0f3] relative transition-transform duration-300 transform md:transform-none ${showSidebar ? 'translate-x-full md:translate-x-0 absolute w-full h-full' : 'translate-x-0'
                }`}>
                {/* Romantic Background */}
                <div className="absolute inset-0 pointer-events-none opacity-10">
                    <img src="https://www.transparenttextures.com/patterns/rose-petals.png" alt="BG" className="w-full h-full object-cover" />
                </div>

                {activeChat ? (
                    <>
                        {/* Header */}
                        <div className="px-4 py-3 md:py-4 border-b border-[#ff4d6d]/20 bg-white/60 backdrop-blur flex justify-between items-center shadow-sm z-10">
                            <div className="flex items-center space-x-3 w-full">
                                <button onClick={() => setShowSettingsModal(true)} className="p-3 text-[#ff4d6d] hover:bg-[#ff4d6d]/10 rounded-2xl transition-all">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                                </button>

                                <div className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-gradient-to-tr from-[#ff4d6d] to-[#ff85a1] flex items-center justify-center font-bold text-sm shadow-lg shadow-[#ff4d6d]/20 shrink-0 text-white">
                                    {activeChat.isGroup ? activeChat.name.charAt(0) : activeChat.participants.filter((p: any) => p.id !== currentUser.id).map((p: any) => p.username).join(", ").charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-base md:text-lg font-black text-gray-800 truncate">
                                        {activeChat.isGroup ? activeChat.name : activeChat.participants.filter((p: any) => p.id !== currentUser.id).map((p: any) => p.username).join(", ")}
                                    </h2>
                                    <div className="flex items-center space-x-2">
                                        {typingUsers.size > 0 ? (
                                            <div className="flex items-center space-x-1 animate-pulse">
                                                <div className="flex space-x-0.5">
                                                    <div className="w-1 h-1 bg-[#ff4d6d] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                    <div className="w-1 h-1 bg-[#ff4d6d] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                    <div className="w-1 h-1 bg-[#ff4d6d] rounded-full animate-bounce"></div>
                                                </div>
                                                <p className="text-[10px] md:text-xs text-[#ff4d6d] font-bold italic">
                                                    {Array.from(typingUsers).join(", ")} {typingUsers.size === 1 ? 'is typing...' : 'are typing...'}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] md:text-xs text-[#ff85a1] font-bold uppercase tracking-widest">
                                                {(() => {
                                                    const otherParticipant = activeChat.participants.find((p: any) => p.id !== currentUser.id);
                                                    if (!otherParticipant) return "Secured Space";

                                                    const liveUser = users.find(u => u.id === otherParticipant.id);
                                                    const isOnline = liveUser ? liveUser.online : otherParticipant.online;
                                                    return isOnline ? "Online" : "Offline";
                                                })()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages Flow */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 flex flex-col custom-scrollbar relative z-0">
                            {messages.filter(m => m.content.toLowerCase().includes(msgSearchTerm.toLowerCase())).map((msg, index) => {
                                const isMe = msg.sender?.id === currentUser.id;
                                return (
                                    <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in-up w-full`}>
                                        <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-md lg:max-w-lg rounded-[2rem] px-5 py-3 shadow-md ${isMe ? 'bg-gradient-to-br from-[#ff4d6d] to-[#ff85a1] text-white rounded-br-sm shadow-[#ff4d6d]/20' : 'bg-white text-gray-800 rounded-bl-sm border border-[#ff4d6d]/10 shadow-black/5'
                                            }`}>
                                            {!isMe && msg.sender && <div className="text-[10px] md:text-xs font-black text-[#ff4d6d] mb-1 uppercase tracking-widest">{msg.sender.username}</div>}

                                            {/* Quoted Message Display */}
                                            {msg.parentMessage && (
                                                <div className={`mb-2 p-2 rounded-2xl border-l-4 bg-black/5 text-xs ${isMe ? 'border-white/50' : 'border-[#ff4d6d]/30'}`}>
                                                    <div className="font-bold mb-0.5">{msg.parentMessage.sender?.username || 'User'}</div>
                                                    <div className="opacity-70 truncate">{msg.parentMessage.content}</div>
                                                </div>
                                            )}

                                            {msg.type === 'IMAGE' && msg.fileUrl ? (
                                                <div className="mb-2 rounded-[1.2rem] overflow-hidden relative group/img">
                                                    <img src={msg.fileUrl} alt="Uploaded" className="max-w-full h-auto object-cover max-h-64" />
                                                    <a href={msg.fileUrl} download className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full opacity-0 group-hover/img:opacity-100 transition-all">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                                                    </a>
                                                    {msg.content && msg.content !== "File" && !msg.content.match(/\.(png|jpe?g|gif|webp)$/i) && <div className="mt-2 text-sm leading-relaxed">{msg.content}</div>}
                                                </div>
                                            ) : msg.type === 'VIDEO' && msg.fileUrl ? (
                                                <div className="mb-2 rounded-xl overflow-hidden relative group bg-black/20">
                                                    <video src={msg.fileUrl} controls preload="metadata" className="max-w-full h-auto max-h-64 object-contain rounded-lg" style={{ backgroundColor: '#0f172a' }} />
                                                    <a href={msg.fileUrl} download={msg.content || "video.mp4"} title="Download Video" onClick={(e) => e.stopPropagation()} className="absolute top-2 right-2 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md backdrop-blur-sm z-10">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                                                    </a>
                                                    {msg.content && !msg.content.match(/\.(mp4|webm|ogg|mov)$/i) && <div className="mt-2 text-sm leading-relaxed">{msg.content}</div>}
                                                </div>
                                            ) : msg.type === 'AUDIO' && msg.fileUrl ? (
                                                <div className="mb-1 rounded-full overflow-hidden bg-white/10 p-1 flex items-center pr-4">
                                                    <div className="w-10 h-10 rounded-full bg-[#a33185]/20 flex items-center justify-center mr-3 shrink-0">
                                                        <svg className="w-5 h-5 text-[#ff8a65]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                                                    </div>
                                                    <audio src={msg.fileUrl} controls className="h-8 max-w-[180px] md:max-w-[240px]" />
                                                </div>
                                            ) : msg.type === 'FILE' && msg.fileUrl ? (
                                                <a href={msg.fileUrl} download={msg.content || "file"} className="flex items-center space-x-3 bg-white/10 p-3 rounded-xl hover:bg-white/20 transition-colors mb-1 cursor-pointer">
                                                    <div className="p-2 bg-[#a33185]/20 rounded-lg">
                                                        <svg className="w-6 h-6 text-[#ff8a65]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                    </div>
                                                    <div className="font-medium text-sm truncate max-w-[150px]">{msg.content || "Download File"}</div>
                                                </a>
                                            ) : (
                                                <div className="text-[13px] md:text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</div>
                                            )}

                                            <div className={`text-[9px] md:text-[10px] mt-1.5 md:mt-2 flex items-center justify-end space-x-1 ${isMe ? 'text-white/70' : 'text-primary-900/40'}`}>
                                                <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {isMe && (
                                                    <span>
                                                        {msg.status === 'READ' ? (
                                                            <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#c0ca33]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 13l5 5L22 4"></path><path d="M7 13l5 5L20 9"></path></svg>
                                                        ) : (
                                                            <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
                                                        )}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Reactions Display */}
                                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                                <div className={`absolute -bottom-2 ${isMe ? 'right-2' : 'left-2'} flex -space-x-1`}>
                                                    {Object.entries(msg.reactions).map(([uid, emoji]: [string, any]) => (
                                                        <div key={uid} className="bg-white/90 border border-rose-100 rounded-full px-1.5 py-0.5 text-[10px] shadow-lg animate-bounce-short">
                                                            {emoji}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Reaction Picker (Simple Hover) */}
                                            <div className={`absolute top-0 ${isMe ? '-left-20' : '-right-20'} opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 bg-white/80 backdrop-blur rounded-full p-1 border border-rose-100 shadow-xl z-20`}>
                                                <button
                                                    onClick={() => setReplyingTo(msg)}
                                                    className="p-1.5 hover:bg-rose-50 rounded-full text-rose-500"
                                                    title="Reply"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                                </button>
                                                <div className="w-px bg-rose-100 h-4 my-auto mx-0.5"></div>
                                                {['👍', '❤️', '😂', '😮', '😢', '🔥'].map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => handleReaction(msg.id, msg.reactions?.[currentUser.id] === emoji ? "" : emoji)}
                                                        className={`hover:scale-125 transition-transform p-1 rounded-full ${msg.reactions?.[currentUser.id] === emoji ? 'bg-rose-100' : ''}`}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} className="h-2 md:h-4" />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 md:p-4 bg-white/60 backdrop-blur-lg border-t border-rose-100 pb-safe z-30 w-full relative">

                            {/* Reply Preview */}
                            {replyingTo && (
                                <div className="max-w-4xl mx-auto mb-3 animate-fade-in-up">
                                    <div className="bg-white/80 border-l-4 border-rose-500 rounded-xl p-3 flex justify-between items-center backdrop-blur shadow-lg border border-white">
                                        <div className="min-w-0">
                                            <div className="text-xs font-black text-rose-500 mb-0.5 uppercase tracking-widest">Replying to {replyingTo.sender?.username}</div>
                                            <div className="text-sm text-rose-900 truncate font-medium">{replyingTo.content}</div>
                                        </div>
                                        <button onClick={() => setReplyingTo(null)} className="p-2 text-rose-300 hover:text-rose-500 transition-colors">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={sendMessage} className="max-w-4xl mx-auto relative group flex space-x-2 md:space-x-3 items-end">

                                <div className="relative">
                                    {showAttachMenu && (
                                        <div className="absolute bottom-full left-0 mb-4 bg-white/90 border border-white/60 rounded-[2rem] p-4 shadow-2xl flex flex-col space-y-3 z-50 animate-fade-in-up w-max backdrop-blur-xl">
                                            <button type="button" onClick={() => { imageInputRef.current?.click(); setShowAttachMenu(false); }} className="flex items-center space-x-4 group pr-6 p-2 rounded-2xl hover:bg-rose-50 transition-all">
                                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#ff4d6d] to-[#ff85a1] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                </div>
                                                <span className="text-sm font-black text-rose-900 group-hover:text-rose-600 tracking-tight">Photos & Videos</span>
                                            </button>

                                            <button type="button" onClick={() => { docInputRef.current?.click(); setShowAttachMenu(false); }} className="flex items-center space-x-4 group pr-6 p-2 rounded-2xl hover:bg-rose-50 transition-all">
                                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#ff4d6d] to-[#ff85a1] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                </div>
                                                <span className="text-sm font-black text-rose-900 group-hover:text-rose-600 tracking-tight">Documents</span>
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        disabled={isRecording}
                                        onClick={(e) => { e.stopPropagation(); setShowAttachMenu(!showAttachMenu); }}
                                        className={`p-3 md:p-4 rounded-2xl md:rounded-3xl transition-all mb-0 shrink-0 shadow-sm border border-rose-100 ${showAttachMenu
                                            ? 'text-white bg-[#ff4d6d] scale-105 border-[#ff4d6d]'
                                            : 'bg-white/60 text-rose-400 hover:text-rose-600 hover:bg-white disabled:opacity-30'
                                            }`}
                                    >
                                        <svg className={`w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 ${showAttachMenu ? 'rotate-45 text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                    </button>
                                </div>

                                {isRecording ? (
                                    <div className="flex-1 flex items-center justify-between bg-white/80 rounded-2xl md:rounded-3xl border border-rose-200 shadow-inner px-4 md:px-5 py-3 md:py-4 h-[48px] md:h-[56px] animate-pulse">
                                        <div className="flex items-center space-x-3 text-rose-500">
                                            <div className="h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(255,77,109,1)]"></div>
                                            <span className="font-mono text-sm md:text-base font-semibold">{formatTime(recordingTime)}</span>
                                            <span className="text-xs text-rose-400 font-black uppercase tracking-widest ml-2 hidden sm:inline">Recording...</span>
                                        </div>
                                        <button type="button" onClick={cancelRecording} className="text-rose-300 hover:text-rose-500 transition-colors p-1" title="Cancel">
                                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1 relative bg-white/80 rounded-2xl md:rounded-3xl border border-rose-100 transition-all focus-within:border-rose-400/50 focus-within:ring-4 focus-within:ring-rose-500/10 focus-within:bg-white shadow-inner overflow-hidden">
                                        <textarea
                                            value={newMessage}
                                            onChange={handleInputChange}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    sendMessage(e);
                                                }
                                            }}
                                            placeholder={isUploading ? "Uploading file..." : (isConnected ? "Our shared feelings..." : "Connecting...")}
                                            disabled={!isConnected || isUploading}
                                            rows={1}
                                            className="w-full bg-transparent text-rose-900 px-4 md:px-5 py-3 md:py-4 text-sm md:text-base focus:outline-none resize-none max-h-24 md:max-h-32 custom-scrollbar placeholder-rose-200 disabled:opacity-50 font-medium"
                                            style={{ minHeight: '48px' }}
                                        />
                                    </div>
                                )}

                                <input type="file" accept="image/*,video/*" ref={imageInputRef} className="hidden" onChange={handleFileSelect} />
                                <input type="file" ref={docInputRef} className="hidden" onChange={handleFileSelect} />

                                {(!newMessage.trim() && !isRecording) ? (
                                    <button type="button" onClick={startRecording} disabled={!isConnected || isUploading}
                                        className="bg-rose-500 text-white rounded-2xl md:rounded-3xl h-12 w-12 md:h-14 md:w-14 flex items-center justify-center hover:bg-rose-400 focus:outline-none focus:ring-4 focus:ring-rose-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-rose-900/10 transform hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none shrink-0 mb-0">
                                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                                    </button>
                                ) : (
                                    <button
                                        type={isRecording ? "button" : "submit"}
                                        onClick={isRecording ? stopRecording : undefined}
                                        disabled={(!newMessage.trim() && !isRecording) || !isConnected || isUploading}
                                        className={`text-white rounded-2xl md:rounded-3xl h-12 w-12 md:h-14 md:w-14 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none shrink-0 mb-0 ${isRecording
                                            ? 'bg-gradient-to-tr from-red-500 to-rose-400 focus:ring-red-500 shadow-red-900/30'
                                            : 'bg-gradient-to-tr from-[#ff4d6d] to-[#ff85a1] focus:ring-[#ff4d6d] shadow-[#ff4d6d]/40'
                                            }`}
                                    >
                                        <svg className={`w-5 h-5 md:w-6 md:h-6 ${!isRecording ? 'ml-0.5 md:ml-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            {isRecording ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                            )}
                                        </svg>
                                    </button>
                                )}
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="hidden md:flex flex-1 flex-col items-center justify-center p-6 z-0 bg-[#fff0f3]">
                        <div className="relative group">
                            <div className="absolute -inset-8 bg-gradient-to-tr from-[#ff4d6d]/20 to-[#ff85a1]/20 rounded-full blur-3xl group-hover:scale-125 transition-all duration-1000"></div>
                            <div className="w-48 h-48 bg-white/60 rounded-[3.5rem] flex items-center justify-center shadow-[0_25px_60px_-15px_rgba(255,77,109,0.25)] border border-white/80 mb-12 rotate-3 animate-bounce-short relative overflow-hidden backdrop-blur-md">
                                <svg className="w-24 h-24 text-[#ff4d6d]" fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                            </div>
                        </div>
                        <h2 className="text-5xl font-black text-rose-900 tracking-tighter mb-4 text-center">
                            Our <span className="text-gradient">Duo Space</span>
                        </h2>
                        <div className="flex items-center space-x-3 mb-12">
                            <span className="h-px w-8 bg-rose-200"></span>
                            <p className="text-[#ff4d6d] font-black uppercase tracking-[0.4em] text-[10px]">Private • Secure • Together</p>
                            <span className="h-px w-8 bg-rose-200"></span>
                        </div>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 77, 109, 0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 77, 109, 0.4); }
                .pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }
                @keyframes fade-in-up { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes bounce-short { 0%, 100% { transform: translateY(0) rotate(3deg); } 50% { transform: translateY(-10px) rotate(3deg); } }
                .animate-bounce-short { animation: bounce-short 3s ease-in-out infinite; }
            `}} />

            {showAddContactModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-xl" onClick={() => setShowAddContactModal(false)}></div>
                    <div className="bg-white/90 border border-white/60 w-full max-w-md rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(255,77,109,0.3)] relative z-10 overflow-hidden flex flex-col animate-fade-in-up max-h-[85vh]">
                        <div className="p-6 border-b border-white/60 bg-white/40 flex justify-between items-center text-[#ff4d6d]">
                            <h3 className="text-xl font-black tracking-tight">Add contact</h3>
                            <button type="button" onClick={() => setShowAddContactModal(false)} className="p-2 hover:bg-[#ff4d6d]/10 rounded-full transition-all">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                            <p className="text-xs text-gray-500 font-medium">Search by username or email (min. 2 characters). People who are already contacts, blocked, or have a pending request won&apos;t appear.</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={addSearchQuery}
                                    onChange={(e) => setAddSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && runAddSearch()}
                                    placeholder="username or email"
                                    className="flex-1 bg-white/60 border border-white/60 rounded-2xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-4 focus:ring-[#ff4d6d]/10 font-bold text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={runAddSearch}
                                    disabled={addSearchLoading}
                                    className="px-4 py-3 rounded-2xl bg-gradient-to-r from-[#ff4d6d] to-[#ff85a1] text-white font-black text-xs uppercase tracking-widest disabled:opacity-50"
                                >
                                    {addSearchLoading ? '…' : 'Search'}
                                </button>
                            </div>
                            <div className="space-y-2">
                                {addSearchResults.map((u: any) => (
                                    <div key={u.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/50 border border-white/60">
                                        <div>
                                            <div className="font-black text-gray-800 text-sm">{u.username}</div>
                                            <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{u.email}</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleSendContactRequest(u.id)}
                                            className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-[#ff4d6d]/10 text-[#ff4d6d] border border-[#ff4d6d]/30 hover:bg-[#ff4d6d] hover:text-white transition-all"
                                        >
                                            Send request
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showRequestsModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-xl" onClick={() => setShowRequestsModal(false)}></div>
                    <div className="bg-white/90 border border-white/60 w-full max-w-md rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(255,77,109,0.3)] relative z-10 overflow-hidden flex flex-col animate-fade-in-up max-h-[85vh]">
                        <div className="p-6 border-b border-white/60 bg-white/40 flex justify-between items-center text-[#ff4d6d]">
                            <h3 className="text-xl font-black tracking-tight">Requests</h3>
                            <button type="button" onClick={() => setShowRequestsModal(false)} className="p-2 hover:bg-[#ff4d6d]/10 rounded-full transition-all">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="flex border-b border-white/60">
                            <button
                                type="button"
                                onClick={() => setRequestsTab('incoming')}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${requestsTab === 'incoming' ? 'text-[#ff4d6d] border-b-2 border-[#ff4d6d]' : 'text-gray-400'}`}
                            >
                                Incoming
                            </button>
                            <button
                                type="button"
                                onClick={() => setRequestsTab('outgoing')}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${requestsTab === 'outgoing' ? 'text-[#ff4d6d] border-b-2 border-[#ff4d6d]' : 'text-gray-400'}`}
                            >
                                Sent
                            </button>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-2 min-h-[200px]">
                            {requestsTab === 'incoming' ? (
                                incomingRequests.length === 0 ? (
                                    <p className="text-center text-xs text-gray-400 py-8">No incoming requests.</p>
                                ) : (
                                    incomingRequests.map((r: any) => (
                                        <div key={r.id} className="p-3 rounded-2xl bg-white/50 border border-white/60 flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="font-black text-gray-800 text-sm truncate">{r.sender?.username}</div>
                                                <div className="text-[10px] text-gray-500 truncate">{r.sender?.email}</div>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                <button type="button" onClick={() => handleAcceptRequest(r.id)} className="px-2 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 text-[10px] font-black uppercase">Accept</button>
                                                <button type="button" onClick={() => handleRejectRequest(r.id)} className="px-2 py-1.5 rounded-lg bg-red-500/10 text-red-600 text-[10px] font-black uppercase">Reject</button>
                                            </div>
                                        </div>
                                    ))
                                )
                            ) : (
                                outgoingRequests.length === 0 ? (
                                    <p className="text-center text-xs text-gray-400 py-8">No outgoing requests.</p>
                                ) : (
                                    outgoingRequests.map((r: any) => (
                                        <div key={r.id} className="p-3 rounded-2xl bg-white/50 border border-white/60 flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="font-black text-gray-800 text-sm truncate">{r.receiver?.username}</div>
                                                <div className="text-[10px] text-gray-500">Pending</div>
                                            </div>
                                            <button type="button" onClick={() => handleCancelOutgoing(r.id)} className="px-2 py-1.5 rounded-lg bg-gray-500/10 text-gray-700 text-[10px] font-black uppercase shrink-0">Cancel</button>
                                        </div>
                                    ))
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Group Modal */}
            {
                showGroupModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-white/20 backdrop-blur-xl" onClick={() => setShowGroupModal(false)}></div>
                        <div className="bg-white/90 border border-white/60 w-full max-w-md rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(255,77,109,0.3)] relative z-10 overflow-hidden flex flex-col animate-fade-in-up">
                            <div className="p-8 border-b border-white/60 bg-white/40 flex justify-between items-center text-[#ff4d6d]">
                                <h3 className="text-2xl font-black tracking-tight">Create Duo Space</h3>
                                <button onClick={() => setShowGroupModal(false)} className="p-2 hover:bg-[#ff4d6d]/10 rounded-full transition-all">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-6 max-h-[60vh]">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Group Identity</label>
                                    <input type="text" placeholder="Enter group name..." value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full bg-white/60 border border-white/60 rounded-2xl px-5 py-4 text-gray-800 focus:outline-none focus:ring-4 focus:ring-[#ff4d6d]/10 transition-all font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Select Members</label>
                                    <div className="space-y-2">
                                        {users.map(user => (
                                            <div key={user.id} onClick={() => toggleUserSelection(user.id)} className={`p-4 flex items-center space-x-4 rounded-2xl cursor-pointer transition-all border-2 ${selectedUsers.includes(user.id) ? 'bg-[#ff4d6d]/10 border-[#ff4d6d]/30' : 'bg-white/40 border-transparent hover:bg-white/80'}`}>
                                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm ${selectedUsers.includes(user.id) ? 'bg-[#ff4d6d] text-white' : 'bg-white text-[#ff4d6d]'}`}>{user.username.charAt(0).toUpperCase()}</div>
                                                <div className={`font-bold flex-1 ${selectedUsers.includes(user.id) ? 'text-[#ff4d6d]' : 'text-gray-700'}`}>{user.username}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 bg-white/20">
                                <button onClick={handleCreateGroup} disabled={isCreatingGroup || !groupName.trim() || selectedUsers.length === 0} className="w-full bg-gradient-to-r from-[#ff4d6d] to-[#ff85a1] text-white font-black py-5 rounded-[1.8rem] shadow-xl shadow-[#ff4d6d]/30 hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50">
                                    {isCreatingGroup ? 'CREATING...' : 'CREATE SPACE'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Settings Modal */}
            {
                showSettingsModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-white/20 backdrop-blur-xl" onClick={() => setShowSettingsModal(false)}></div>
                        <div className="bg-white/90 border border-white/60 w-full max-w-md rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(255,77,109,0.3)] relative z-10 overflow-hidden flex flex-col animate-fade-in-up">
                            <div className="p-8 border-b border-white/60 bg-white/40 flex justify-between items-center text-[#ff4d6d]">
                                <h3 className="text-2xl font-black tracking-tight">Profile Settings</h3>
                                <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-[#ff4d6d]/10 rounded-full transition-all">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar max-h-[65vh]">
                                {/* Avatar Section */}
                                <div className="flex flex-col items-center">
                                    <input type="file" accept="image/*" ref={profilePhotoInputRef} className="hidden" onChange={handleProfilePhotoSelect} />
                                    <div className="relative group cursor-pointer mb-4" onClick={() => profilePhotoInputRef.current?.click()}>
                                        <div className="h-32 w-32 rounded-[2.5rem] bg-gradient-to-tr from-[#ff4d6d] to-[#ff85a1] flex items-center justify-center text-5xl font-black text-white shadow-2xl rotate-3 border-4 border-white overflow-hidden transition-transform group-hover:scale-105 group-hover:rotate-6">
                                            {profilePhotoPreview || currentUser.profilePicture || currentUser.profilePhoto ? (
                                                <img src={profilePhotoPreview || currentUser.profilePicture || currentUser.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                currentUser.username.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="absolute inset-0 rounded-[2.5rem] bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-2.5 rounded-2xl shadow-lg">
                                                <svg className="w-6 h-6 text-[#ff4d6d]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[#ff4d6d] text-[10px] font-black uppercase tracking-[0.3em] mt-1">Tap to change photo</p>
                                </div>

                                {/* Username Field */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Display Name</label>
                                    <input
                                        type="text"
                                        placeholder="Your name..."
                                        value={profileUsername}
                                        onChange={(e) => setProfileUsername(e.target.value)}
                                        maxLength={20}
                                        className="w-full bg-white/60 border border-white/60 rounded-2xl px-5 py-4 text-gray-800 focus:outline-none focus:ring-4 focus:ring-[#ff4d6d]/10 transition-all font-bold text-lg"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-2 font-medium">{profileUsername.length}/20 characters</p>
                                </div>

                                {/* Bio Field */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Your Bio</label>
                                    <textarea
                                        placeholder="Tell your favorite person something..."
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        rows={3}
                                        maxLength={200}
                                        className="w-full bg-white/60 border border-white/60 rounded-2xl px-5 py-4 text-gray-800 focus:outline-none focus:ring-4 focus:ring-[#ff4d6d]/10 transition-all font-bold resize-none"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-2 font-medium">{bio.length}/200 characters</p>
                                </div>

                                {/* Account Info */}
                                <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-100">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Account</label>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-xl bg-[#ff4d6d]/10 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-[#ff4d6d]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            </div>
                                            <span className="text-sm font-bold text-gray-600">{currentUser.email || 'No email set'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-xl bg-[#ff4d6d]/10 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-[#ff4d6d]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                            </div>
                                            <span className="text-sm font-bold text-gray-600">Role: {currentUser.role?.replace('ROLE_', '') || 'USER'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Logout Button */}
                                <button
                                    onClick={() => { AuthService.logout(); navigate('/login'); }}
                                    className="w-full flex items-center justify-center space-x-2 py-4 rounded-2xl border-2 border-rose-200 text-rose-500 font-black uppercase tracking-widest text-xs hover:bg-rose-50 transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                    <span>Logout</span>
                                </button>
                            </div>
                            <div className="p-8 bg-white/20">
                                <button onClick={handleUpdateProfile} disabled={isUpdatingProfile} className="w-full bg-gradient-to-r from-[#ff4d6d] to-[#ff85a1] text-white font-black py-5 rounded-[1.8rem] shadow-xl shadow-[#ff4d6d]/30 hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50">
                                    {isUpdatingProfile ? 'SAVING...' : 'SAVE CHANGES'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* File Preview Modal */}
            {
                selectedFile && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-white/80 backdrop-blur-3xl animate-fade-in">
                        <button onClick={() => { setSelectedFile(null); setFilePreview(null); }} className="absolute top-8 right-8 p-4 rounded-full bg-white shadow-2xl text-gray-400 hover:text-red-500 transition-all z-50 border border-white/60">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <div className="w-full max-w-4xl flex flex-col items-center">
                            <div className="w-full aspect-video max-h-[65vh] bg-white rounded-[3rem] overflow-hidden flex items-center justify-center shadow-2xl border border-white/60 mb-10 relative">
                                {filePreview ? (
                                    selectedFile.type.startsWith('video/') ? (
                                        <video src={filePreview} controls className="max-w-full max-h-full object-contain" />
                                    ) : (
                                        <img src={filePreview} alt="Preview" className="max-w-full max-h-full object-contain" />
                                    )
                                ) : (
                                    <div className="flex flex-col items-center text-gray-400">
                                        <svg className="w-24 h-24 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                        <span className="text-xl font-black uppercase tracking-[0.2em]">{selectedFile.name.split('.').pop()}</span>
                                    </div>
                                )}
                                {isUploading && (
                                    <div className="absolute inset-0 bg-white/40 backdrop-blur-md flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 border-4 border-[#ff4d6d] border-t-transparent rounded-full animate-spin mb-4"></div>
                                        <span className="text-[#ff4d6d] font-black uppercase tracking-widest">Sharing Moment...</span>
                                    </div>
                                )}
                            </div>
                            <div className="w-full max-w-2xl bg-white shadow-2xl rounded-[2rem] p-2 border border-white/60 flex items-center space-x-4">
                                <input autoFocus type="text" placeholder="Tell the story of this moment..." value={fileCaption} onChange={(e) => setFileCaption(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleFileUpload()} className="flex-1 bg-transparent border-none text-gray-800 px-8 py-5 focus:outline-none text-lg font-bold" />
                                <button onClick={handleFileUpload} disabled={isUploading} className="bg-gradient-to-tr from-[#ff4d6d] to-[#ff85a1] p-5 rounded-[1.6rem] text-white shadow-xl hover:scale-105 active:scale-90 transition-all">
                                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Dashboard;
