import { useState, useEffect } from 'react';
import api from '../../api';

export const AdminSettings = () => {
    const [settings, setSettings] = useState<any[]>([]);
    const [broadcastMsg, setBroadcastMsg] = useState("");
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings');
            setSettings(res.data);
            // Default settings if empty for demo
            if (res.data.length === 0) {
                setSettings([
                    { settingKey: 'MAINTENANCE_MODE', settingValue: 'false', description: 'Disable all user access for maintenance.' },
                    { settingKey: 'REGISTRATION_ENABLED', settingValue: 'true', description: 'Allow new users to create accounts.' },
                    { settingKey: 'MAX_UPLOAD_SIZE_MB', settingValue: '25', description: 'Global limit for file uploads.' }
                ]);
            }
        } catch {
            console.error("Failed to fetch settings");
        }
    };

    const saveSettings = async () => {
        try {
            await api.put('/admin/settings', settings);
            alert("System settings updated successfully.");
        } catch {
            alert("Failed to update settings.");
        }
    };

    const handleBroadcast = async () => {
        if (!broadcastMsg.trim()) return;
        setIsBroadcasting(true);
        try {
            await api.post('/broadcast', { message: broadcastMsg });
            alert("Broadcast sent to all online users!");
            setBroadcastMsg("");
        } catch {
            alert("Failed to send broadcast.");
        } finally {
            setIsBroadcasting(false);
        }
    };

    const updateSettingValue = (key: string, value: string) => {
        setSettings(settings.map(s => s.settingKey === key ? { ...s, settingValue: value } : s));
    };

    const renderToggle = (key: string, label: string) => {
        const setting = settings.find(s => s.settingKey === key);
        const isActive = setting?.settingValue === "true";

        return (
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-primary-500/30 transition-all">
                <div>
                    <div className="text-sm font-bold text-white">{label}</div>
                    <div className="text-[10px] text-duo-lavenderMuted italic">{setting?.description || 'Global system toggle'}</div>
                </div>
                <button
                    onClick={() => updateSettingValue(key, isActive ? "false" : "true")}
                    className={`w-12 h-6 rounded-full transition-all relative ${isActive ? 'bg-primary-500 shadow-lg shadow-primary-500/30' : 'bg-white/10'}`}
                >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isActive ? 'right-1' : 'left-1'}`}></div>
                </button>
            </div>
        );
    };

    return (
        <div className="relative z-10 animate-fade-in-up">
            <h1 className="text-3xl font-extrabold text-white mb-2">System Control</h1>
            <p className="text-duo-lavenderMuted text-sm mb-10">Configure global platform behavior and critical safety toggles.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white/5 rounded-2xl border border-white/10 p-8 backdrop-blur shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        Feature Control
                    </h3>

                    <div className="space-y-4 mb-8">
                        {renderToggle("MAINTENANCE_MODE", "Maintenance Mode")}
                        {renderToggle("REGISTRATION_ENABLED", "User Registration")}
                        {renderToggle("CHAT_ENABLED", "Messaging Services")}
                        {renderToggle("MEDIA_ENABLED", "Media Uploads")}
                        {renderToggle("GROUPS_ENABLED", "Public Groups")}
                    </div>

                    <button
                        onClick={saveSettings}
                        className="w-full bg-primary-500 hover:bg-primary-400 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary-500/20 active:scale-95"
                    >
                        Save All Changes
                    </button>
                </div>

                {/* Broadcasting */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-8 backdrop-blur shadow-xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-duo-blush/5 rounded-full blur-3xl"></div>
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-duo-blush" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
                        Global Broadcast
                    </h3>

                    <p className="text-xs text-duo-lavenderMuted mb-6 italic">Send a real-time announcement to all online users. This will appear as an urgent notification on their screens.</p>

                    <textarea
                        className="w-full h-40 bg-black/20 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-duo-blush/50 transition-all placeholder-duo-lavenderMuted/30 mb-6 resize-none"
                        placeholder="Type your announcement here..."
                        value={broadcastMsg}
                        onChange={(e) => setBroadcastMsg(e.target.value)}
                    ></textarea>

                    <button
                        onClick={handleBroadcast}
                        disabled={isBroadcasting || !broadcastMsg.trim()}
                        className="w-full bg-gradient-to-r from-duo-blush to-primary-500 hover:from-duo-blush/80 hover:to-primary-500/80 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-duo-blush/20 flex items-center justify-center space-x-2"
                    >
                        {isBroadcasting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                                <span>Send to Everyone</span>
                            </>
                        )}
                    </button>

                    <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center space-x-2 text-[10px] text-primary-300 font-bold uppercase mb-2">
                            <span className="h-2 w-2 rounded-full bg-primary-400 animate-pulse"></span>
                            <span>Live Network Status</span>
                        </div>
                        <div className="text-[10px] text-duo-lavenderMuted flex justify-between">
                            <span>Relay Server: Operational</span>
                            <span>Latency: 24ms</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
