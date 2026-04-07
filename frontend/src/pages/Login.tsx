import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthService from '../services/auth.service';
import { useNotification } from '../context/NotificationContext';

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const { showNotification } = useNotification();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        AuthService.login(username, password).then(
            () => {
                if (rememberMe) {
                    localStorage.setItem('remembered_username', username);
                } else {
                    localStorage.removeItem('remembered_username');
                }
                showNotification("Logged in successfully", "success");
                navigate("/dashboard");
                window.location.reload();
            },
            (error) => {
                const resMessage = (error.response?.data?.message) || error.message || error.toString();
                setLoading(false);
                showNotification(resMessage, "error");
                
                // If not verified, redirect to verify
                if (resMessage.toLowerCase().includes("not verified")) {
                    setTimeout(() => navigate("/verify", { state: { username } }), 1500);
                }
            }
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#fff0f3] px-4">
            {/* Romantic Background Image */}
            <div className="absolute inset-0 z-0">
                <img src="/assets/romantic_bg.png" alt="Background" className="w-full h-full object-cover opacity-60 scale-105 blur-[1px]" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#fff0f3]/40 via-transparent to-[#fff0f3]/60"></div>
            </div>

            <div className="max-w-md w-full relative z-10">
                <div className="backdrop-blur-2xl bg-white/60 border border-white/60 p-10 rounded-[3rem] shadow-[0_30px_60px_rgba(255,77,109,0.2)] space-y-8 animate-slide-up">
                    <div className="text-center">
                        <h2 className="text-4xl font-black text-gray-800 tracking-tight">Duo <span className="text-[#ff4d6d]">Login</span></h2>
                        <p className="mt-2 text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em]">Welcome back to your private space.</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div className="space-y-4">
                            <div className="relative group">
                                <input type="text" required placeholder="Username" className="w-full bg-white/80 border border-white/20 rounded-2xl px-5 py-4 text-gray-800 focus:outline-none focus:ring-4 focus:ring-[#ff4d6d]/10 focus:border-[#ff4d6d] transition-all font-medium"
                                    value={username} onChange={e => setUsername(e.target.value)} />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </div>
                            </div>

                            <div className="relative group">
                                <input type={showPassword ? "text" : "password"} required placeholder="Password" className="w-full bg-white/80 border border-white/20 rounded-2xl px-5 py-4 text-gray-800 focus:outline-none focus:ring-4 focus:ring-[#ff4d6d]/10 focus:border-[#ff4d6d] transition-all font-medium"
                                    value={password} onChange={e => setPassword(e.target.value)} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#ff4d6d] transition-colors focus:outline-none">
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.882 9.882L5.146 5.147m3.344 3.344l3.536 3.536m3.537 3.537L20.854 20.854" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center space-x-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#ff4d6d] focus:ring-[#ff4d6d]" 
                                    checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                                <span className="text-xs font-bold text-gray-500 group-hover:text-gray-700 transition-colors uppercase tracking-wider">Remember Me</span>
                            </label>
                            <Link to="/forgot-password" className="text-xs font-bold text-[#ff4d6d] hover:underline uppercase tracking-wider">Forgot Password?</Link>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full bg-gradient-to-r from-[#ff4d6d] to-[#ff85a1] hover:scale-[1.02] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#ff4d6d]/20 transition-all active:scale-[0.98] disabled:opacity-70 text-lg uppercase tracking-widest">
                            {loading ? "Syncing Duo Hearts..." : "Enter Our World"}
                        </button>
                    </form>

                    <div className="text-center">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-loose">
                            New to Duo? <Link to="/register" className="text-[#ff4d6d] hover:underline">Start Your Journey</Link>
                        </p>
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

export default Login;
