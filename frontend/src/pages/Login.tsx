import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthService from '../services/auth.service';

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        AuthService.login(username, password).then(
            () => {
                navigate("/dashboard");
                window.location.reload();
            },
            (error) => {
                const resMessage =
                    (error.response && error.response.data && error.response.data.message) ||
                    error.message || error.toString();
                setLoading(false);
                setMessage(resMessage);
            }
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#fff0f3]">
            {/* Romantic Background Image */}
            <div className="absolute inset-0 z-0">
                <img src="/assets/romantic_bg.png" alt="Background" className="w-full h-full object-cover opacity-60 scale-105 blur-[1px]" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#fff0f3]/40 via-transparent to-[#fff0f3]/60"></div>
            </div>

            {/* Floating Soft Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#ff4d6d]/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff85a1]/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="max-w-md w-full mx-4 relative z-10">
                <div className="backdrop-blur-2xl bg-white/40 border border-white/40 p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(255,77,109,0.15)] space-y-8">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#ff4d6d] to-[#ff85a1] mb-6 shadow-xl shadow-[#ff4d6d]/20 relative group">
                            <span className="text-white text-4xl font-black italic">C</span>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#ff4d6d] shadow-md group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                            </div>
                        </div>
                        <h2 className="text-4xl font-black text-gray-800 tracking-tight">ChatSphere <span className="text-[#ff4d6d]">Duo</span></h2>
                        <p className="mt-2 text-gray-600 text-sm font-bold uppercase tracking-widest leading-loose">The Private Space for You Two.</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div className="space-y-4">
                            <div className="relative group">
                                <input name="username" type="text" required
                                    className="w-full bg-white/60 border border-white/20 rounded-2xl px-5 py-4 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-[#ff4d6d]/10 focus:border-[#ff4d6d] transition-all duration-300 font-medium"
                                    placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
                            </div>

                            <div className="relative group">
                                <input name="password" type="password" required
                                    className="w-full bg-white/60 border border-white/20 rounded-2xl px-5 py-4 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-[#ff4d6d]/10 focus:border-[#ff4d6d] transition-all duration-300 font-medium"
                                    placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                            </div>
                        </div>

                        {message && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3 px-4 rounded-xl text-center font-semibold animate-shake">
                                {message}
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full bg-gradient-to-r from-[#ff4d6d] to-[#ff85a1] hover:scale-[1.03] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#ff4d6d]/30 transition-all duration-300 active:scale-[0.97] disabled:opacity-70 text-lg tracking-tight">
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Connecting Duo...
                                </span>
                            ) : "Enter Our Space"}
                        </button>
                    </form>

                    <div className="text-center">
                        <p className="text-gray-600 text-sm font-medium">
                            New couple? <Link to="/register" className="text-[#ff4d6d] font-black hover:underline">Create Duo Account</Link>
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake { animation: shake 0.4s ease-in-out; }
            `}</style>
        </div>
    );
};

export default Login;
