import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthService from '../services/auth.service';
import { useNotification } from '../context/NotificationContext';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [step, setStep] = useState(1); // 1: Email, 2: Code + Pass
    const [loading, setLoading] = useState(false);
    const [successful, setSuccessful] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { showNotification } = useNotification();

    const handleSendCode = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        AuthService.forgotPassword(email).then(
            (response) => {
                showNotification(response.data.message || "Recovery code sent to email", "success");
                setStep(2);
                setLoading(false);
            },
            (error) => {
                const resMessage = (error.response?.data?.message) || error.message || error.toString();
                setLoading(false);
                showNotification(resMessage, "error");
            }
        );
    };

    const handleReset = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        AuthService.resetPassword(email, code, newPassword).then(
            (response) => {
                showNotification(response.data.message || "Password reset successfully!", "success");
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
            <div className="absolute inset-0 z-0">
                <img src="/assets/romantic_bg.png" alt="Background" className="w-full h-full object-cover opacity-60 scale-105 blur-[1px]" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#fff0f3]/40 via-transparent to-[#fff0f3]/60"></div>
            </div>

            <div className="max-w-md w-full relative z-10">
                <div className="backdrop-blur-2xl bg-white/60 border border-white/60 p-10 rounded-[3rem] shadow-[0_30px_60px_rgba(255,77,109,0.2)] space-y-8 animate-slide-up">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-[#ff4d6d]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-[#ff4d6d]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                        </div>
                        <h2 className="text-3xl font-black text-gray-800 tracking-tight">Duo <span className="text-[#ff4d6d]">Recovery</span></h2>
                        <p className="mt-2 text-gray-600 text-[10px] font-bold uppercase tracking-widest leading-loose">
                            {step === 1 ? "Enter your email to receive recovery code." : "Set your new password below."}
                        </p>
                    </div>

                    {!successful ? (
                        <form className="space-y-6" onSubmit={step === 1 ? handleSendCode : handleReset}>
                            <div className="space-y-4">
                                {step === 1 ? (
                                    <div className="relative group">
                                        <input type="email" required placeholder="Account Email" 
                                            className="w-full bg-white/80 border border-white/20 rounded-2xl px-5 py-4 text-gray-800 focus:outline-none focus:ring-4 focus:ring-[#ff4d6d]/10 focus:border-[#ff4d6d] transition-all font-medium"
                                            value={email} onChange={e => setEmail(e.target.value)} />
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative group">
                                            <input type="text" required placeholder="Recovery Code" 
                                                className="w-full bg-white/80 border border-white/20 rounded-2xl px-5 py-4 text-center text-xl font-black tracking-[0.2em] text-[#ff4d6d] focus:outline-none focus:ring-4 focus:ring-[#ff4d6d]/10 focus:border-[#ff4d6d] transition-all"
                                                value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} />
                                        </div>
                                        <div className="relative group">
                                            <div className="relative">
                                                <input type={showPassword ? "text" : "password"} required placeholder="New Password" 
                                                    className="w-full bg-white/80 border border-white/20 rounded-2xl px-5 py-4 text-gray-800 focus:outline-none focus:ring-4 focus:ring-[#ff4d6d]/10 focus:border-[#ff4d6d] transition-all font-medium"
                                                    value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#ff4d6d] transition-colors focus:outline-none">
                                                    {showPassword ? (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.882 9.882L5.146 5.147m3.344 3.344l3.536 3.536m3.537 3.537L20.854 20.854" /></svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {message && (
                                <div className={`text-[10px] py-3 px-4 rounded-xl text-center font-bold uppercase tracking-widest animate-shake ${message.includes("sent") || message.includes("success") ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                                    {message}
                                </div>
                            )}

                            <button type="submit" disabled={loading}
                                className="w-full bg-gradient-to-r from-[#ff4d6d] to-[#ff85a1] hover:scale-[1.02] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#ff4d6d]/20 transition-all active:scale-[0.98] disabled:opacity-70 text-lg uppercase tracking-widest">
                                {loading ? "Re-syncing hearts..." : step === 1 ? "Send Recovery Code" : "Reset Password"}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center space-y-6 py-8">
                            <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-gray-800 italic">Access Restored!</h3>
                                <p className="text-gray-600 text-sm font-medium px-4">Your password has been updated. Redirecting...</p>
                            </div>
                        </div>
                    )}

                    <div className="text-center">
                        <Link to="/login" className="text-gray-400 hover:text-gray-600 text-[10px] font-bold uppercase tracking-widest transition-colors">Return to Login</Link>
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

export default ForgotPassword;
