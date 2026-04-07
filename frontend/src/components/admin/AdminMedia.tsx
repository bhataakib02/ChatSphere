import { useState, useEffect } from 'react';
import api from '../../api';
import { useNotification } from '../../context/NotificationContext';

export const AdminMedia = () => {
    const [media, setMedia] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();

    useEffect(() => {
        fetchMedia();
    }, []);

    const fetchMedia = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/media');
            setMedia(res.data);
        } catch {
            showNotification("Failed to fetch media", "error");
        } finally {
            setLoading(false);
        }
    };

    const deleteMedia = async (id: number) => {
        if (!window.confirm("Delete this media file globally?")) return;
        try {
            await api.delete(`/admin/messages/${id}`);
            setMedia(media.filter(m => m.id !== id));
            showNotification("Media deleted successfully", "success");
        } catch {
            showNotification("Failed to delete media.", "error");
        }
    };

    return (
        <div className="relative z-10 animate-fade-in-up">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">Media Management</h1>
                    <p className="text-duo-lavenderMuted text-sm">Audit all uploaded assets and remove suspicious content.</p>
                </div>
                {media.length > 0 && (
                    <button onClick={async () => {
                        if (window.confirm('Delete all media files globally?')) {
                            await api.delete('/admin/cleanup?type=ALL_MEDIA');
                            fetchMedia();
                        }
                    }} className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-lg scale-95 hover:scale-100">
                        Clear All Media
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-20 animate-pulse text-duo-lavenderMuted italic">Fetching media vault...</div>
            ) : media.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5 text-duo-lavenderMuted">
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    No media files detected on the server.
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {media.map(m => (
                        <div key={m.id} className="group relative bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-primary-500/50 transition-all shadow-xl">
                            <div className="aspect-square bg-black/40 flex items-center justify-center overflow-hidden">
                                {m.type === 'IMAGE' ? (
                                    <img src={m.url} alt="User upload" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="flex flex-col items-center p-4">
                                        <svg className="w-12 h-12 text-primary-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">{m.type}</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-3 bg-gradient-to-t from-black/80 to-transparent">
                                <div className="text-[10px] font-bold text-primary-300">@{m.sender}</div>
                                <div className="text-[8px] text-duo-lavenderMuted italic">{new Date(m.createdAt).toLocaleDateString()}</div>
                            </div>

                            <button
                                onClick={() => deleteMedia(m.id)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-400 shadow-lg scale-90 group-hover:scale-100"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
