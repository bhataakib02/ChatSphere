import { useState, useEffect } from 'react';
import api from '../../api';

export const AdminReports = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');

    useEffect(() => {
        fetchReports();
    }, [filter]);

    const fetchReports = async () => {
        try {
            const res = await api.get(`/admin/reports?status=${filter}`);
            setReports(res.data);
        } catch {
            console.error("Failed to fetch reports");
        } finally {
            setLoading(false);
        }
    };

    const resolveReport = async (reportId: number, status: string) => {
        const notes = prompt("Enter resolution notes:");
        if (notes === null) return;
        try {
            await api.put(`/admin/reports/${reportId}`, { status, notes });
            setReports(reports.filter(r => r.id !== reportId));
        } catch {
            alert("Failed to resolve report.");
        }
    };

    return (
        <div className="relative z-10 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">Reports & Moderation</h1>
                    <p className="text-duo-lavenderMuted">Handle community complaints and enforce safety guidelines.</p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    {['PENDING', 'RESOLVED', 'IGNORED'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === s ? 'bg-primary-500 text-white shadow-lg' : 'text-duo-lavenderMuted hover:text-white'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center text-duo-mist animate-pulse">Loading reports...</div>
            ) : reports.length === 0 ? (
                <div className="py-20 bg-white/5 rounded-2xl border border-dashed border-white/10 text-center text-duo-lavenderMuted">
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p className="font-medium text-lg">Clean Slate!</p>
                    <p className="text-sm">No {filter.toLowerCase()} reports at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {reports.map((report) => (
                        <div key={report.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur flex flex-col md:flex-row group hover:border-primary-500/30 transition-all">
                            <div className="p-6 flex-1">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <span className="px-2 py-0.5 bg-red-500/10 text-red-300 border border-red-500/20 rounded text-[10px] font-bold uppercase tracking-tighter">REPORT #{report.id}</span>
                                        <span className="text-duo-lavenderMuted text-xs font-mono">{new Date(report.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => resolveReport(report.id, 'RESOLVED')} className="bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white border border-green-500/30 px-3 py-1 rounded-lg text-[10px] font-bold transition-all">RESOLVE</button>
                                        <button onClick={() => resolveReport(report.id, 'IGNORED')} className="bg-white/5 hover:bg-white/20 text-duo-mist border border-white/10 px-3 py-1 rounded-lg text-[10px] font-bold transition-all">IGNORE</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                        <p className="text-[10px] text-primary-300 font-bold uppercase mb-1">Reporter</p>
                                        <p className="text-white font-medium">{report.reporter?.username || 'System'}</p>
                                        <p className="text-[10px] text-duo-lavenderMuted">ID: #{report.reporter?.id}</p>
                                    </div>
                                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                        <p className="text-[10px] text-red-300 font-bold uppercase mb-1">Reported Object</p>
                                        <p className="text-white font-medium">{report.reportedUser ? `User: ${report.reportedUser.username}` : report.reportedMessage ? 'Message Content' : 'Unknown'}</p>
                                        <p className="text-[10px] text-duo-lavenderMuted">Ref: {report.reportedUser?.id || report.reportedMessage?.id}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] text-duo-lavenderMuted font-bold uppercase mb-1 underline decoration-primary-500/50">Reason & Context</p>
                                        <p className="text-duo-mist text-sm italic">"{report.reason}"</p>
                                    </div>
                                    {report.reportedMessage && (
                                        <div className="bg-white/5 p-4 rounded-xl border-l-4 border-primary-500">
                                            <p className="text-[10px] text-duo-lavenderMuted font-bold uppercase mb-2">Flagged Content</p>
                                            <p className="text-white text-sm leading-relaxed">{report.reportedMessage.content}</p>
                                        </div>
                                    )}
                                    {report.adminNotes && (
                                        <div className="bg-primary-500/5 p-3 rounded-xl border border-primary-500/20">
                                            <p className="text-[10px] text-primary-300 font-bold uppercase mb-1">Admin Resolution Notes</p>
                                            <p className="text-primary-100/80 text-xs italic">{report.adminNotes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
