import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import AuthService from '../services/auth.service';
import { useNotification } from '../context/NotificationContext';

const Verification = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [successful, setSuccessful] = useState(false);
    const { showNotification } = useNotification();

    useEffect(() => {
        if (location.state && location.state.username) {
            setUsername(location.state.username);
        }
    }, [location]);

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        AuthService.verify(username, code).then(
            (response) => {
                showNotification(response.data.message || "Email verified successfully!", "success");
                setSuccessful(true);
                setTimeout(() => navigate("/login"), 2000);
            },
            (error) => {
                const resMessage = (error.response?.data?.message) || error.message || error.toString();
                setLoading(false);
                showNotification(resMessage, "error");
            }
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#fff0f3] px-4">
            <div className="absolute inset-0 z-0 text-gray-100 flex items-center justify-center opacity-10 pointer-events-none select-none">
                <span className="text-[20vw] font-black italic tracking-tighter">SECURE</span>
            </div>

            <div className="max-w-md w-full relative z-10">
                <div className="backdrop-blur-2xl bg-white/60 border border-white/60 p-10 rounded-[3rem] shadow-[0_30px_60px_rgba(255,77,109,0.2)] space-y-8 animate-slide-up">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-[#ff4d6d]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-[#ff4d6d]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 21a10.003 10.003 0 008.384-4.51l.054.09m-4.289-2.04q.169.278.33.56m-8.914-4.289q.169-.278.33-.56M12 7V3m0 0L9 6m3-3l3 3m-3 11h.01" /></svg>
                        </div>
                        <h2 className="text-3xl font-black text-gray-800 tracking-tight">Verify <span className="text-[#ff4d6d]">Duo</span></h2>
                        <p className="mt-2 text-gray-600 text-[10px] font-bold uppercase tracking-widest leading-loose">Enter the code sent to your email.</p>
                    </div>

                    {!successful ? (
                        <form className="space-y-6" onSubmit={handleVerify}>
                            <div className="space-y-4">
                                <div className="relative group">
                                    <input type="text" required placeholder="Authentication Code" 
                                        className="w-full bg-white/80 border border-white/20 rounded-2xl px-5 py-5 text-center text-2xl font-black tracking-[0.5em] text-[#ff4d6d] focus:outline-none focus:ring-4 focus:ring-[#ff4d6d]/10 focus:border-[#ff4d6d] transition-all"
                                        value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} />
                                </div>
                            </div>

                            {message && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] py-3 px-4 rounded-xl text-center font-bold uppercase tracking-wider animate-shake">
                                    {message}
                                </div>
                            )}

                            <button type="submit" disabled={loading || code.length < 6}
                                className="w-full bg-gradient-to-r from-[#ff4d6d] to-[#ff85a1] hover:scale-[1.02] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#ff4d6d]/20 transition-all active:scale-[0.98] disabled:opacity-50 text-lg uppercase tracking-widest">
                                {loading ? "Verifying duo identity..." : "Verify & Connect"}
                            </button>

                            <div className="text-center">
                                <button type="button" className="text-gray-400 hover:text-[#ff4d6d] text-[10px] font-bold uppercase tracking-widest transition-colors">
                                    Didn't receive code? <span className="underline">Resend</span>
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="text-center space-y-6 py-8">
                            <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-gray-800 italic">Identity Confirmed!</h3>
                                <p className="text-gray-600 text-sm font-medium px-4">Your Duo Space is now active. Redirecting...</p>
                            </div>
                        </div>
                    )}

                    <div className="text-center">
                        <Link to="/login" className="text-gray-400 hover:text-gray-600 text-[10px] font-bold uppercase tracking-widest transition-colors">Back to Login</Link>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                .animate-slide-up { animation: slide-up 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
                .animate-shake { animation: shake 0.4s ease-in-out; }
            `}</style>
        </div>
    );
};

export default Verification;
