import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/auth.service';
import { useNotification } from '../context/NotificationContext';

const Register = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [profilePreview, setProfilePreview] = useState<string | null>(null);
    const [successful, setSuccessful] = useState(false);
    const [loading, setLoading] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [strength, setStrength] = useState({ score: 0, label: "Weak", color: "bg-gray-300" });
    const [showPassword, setShowPassword] = useState(false);

    // CAPTCHA State
    const [captcha, setCaptcha] = useState({ a: 0, b: 0 });
    const [captchaAnswer, setCaptchaAnswer] = useState("");

    const generateCaptcha = () => {
        setCaptcha({
            a: Math.floor(Math.random() * 10) + 1,
            b: Math.floor(Math.random() * 10) + 1
        });
        setCaptchaAnswer("");
    };

    useEffect(() => {
        generateCaptcha();
    }, []);

    useEffect(() => {
        // Auto-suggest username from full name
        if (fullName && !username) {
            const suggested = fullName.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 100);
            setUsername(suggested);
        }
    }, [fullName, username]);

    useEffect(() => {
        // Simple password strength logic
        let score = 0;
        if (password.length > 7) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        const labels = ["Very Weak", "Weak", "Medium", "Strong", "Premium Secure"];
        const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-primary-500"];
        setStrength({ score, label: labels[score], color: colors[score] });
    }, [password]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setProfilePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const { showNotification } = useNotification();

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();

        if (parseInt(captchaAnswer) !== (captcha.a + captcha.b)) {
            showNotification("Incorrect CAPTCHA! Are you a robot?", "error");
            generateCaptcha();
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            showNotification("Please provide a strictly valid email address format.", "error");
            generateCaptcha();
            return;
        }

        if (!agreed) {
            showNotification("You must agree to the Terms and Conditions.", "error");
            return;
        }
        if (strength.score < 3) {
            showNotification("Please choose a stronger password.", "error");
            return;
        }

        setSuccessful(false);
        setLoading(true);

        AuthService.register(username, email, password, fullName).then(
            (response) => {
                showNotification(response.data.message || "Registration successful!", "success");
                setSuccessful(true);
                // Redirect straight to login, bypassing unused OTP verify flow
                setTimeout(() => navigate("/login"), 2000);
            },
            (error) => {
                const resMessage = (error.response?.data?.message) || error.message || error.toString();
                showNotification(resMessage, "error");
                setSuccessful(false);
                setLoading(false);
                generateCaptcha();
            }
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#fff0f3] py-12 px-4">
            {/* Romantic Background Image */}
            <div className="absolute inset-0 z-0">
                <img src="/assets/romantic_bg.png" alt="Background" className="w-full h-full object-cover opacity-50 scale-110 blur-[2px]" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#fff0f3]/50 via-transparent to-[#fff0f3]/70"></div>
            </div>

            <div className="max-w-xl w-full relative z-10">
                <div className="backdrop-blur-2xl bg-white/60 border border-white/60 p-8 md:p-12 rounded-[3rem] shadow-[0_30px_60px_rgba(255,77,109,0.2)] space-y-8 animate-fade-in">
                    <div className="text-center">
                        <h2 className="text-4xl font-black text-gray-800 tracking-tight mb-2">Join the <span className="text-[#ff4d6d]">Duo</span></h2>
                        <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">Create your premium private sanctuary.</p>
                    </div>

                    {!successful ? (
                        <form className="space-y-5" onSubmit={handleRegister}>
                            {/* Profile Setup */}
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative group cursor-pointer">
                                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100 flex items-center justify-center transition-all group-hover:scale-105">
                                        {profilePreview ? (
                                            <img src={profilePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        </div>
                                    </div>
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept="image/*" />
                                </div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Upload Profile Photo</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4 md:col-span-2">
                                    <input type="text" required placeholder="Full Name" className="w-full bg-white/80 border border-white/40 rounded-2xl px-5 py-4 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-[#ff4d6d]/10 focus:border-[#ff4d6d] transition-all font-medium shadow-sm"
                                        value={fullName} onChange={e => setFullName(e.target.value)} />
                                </div>
                                <input type="text" required placeholder="Username" className="w-full bg-white/80 border border-white/40 rounded-2xl px-5 py-4 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-[#ff4d6d]/10 focus:border-[#ff4d6d] transition-all font-medium shadow-sm"
                                    value={username} onChange={e => setUsername(e.target.value)} />
                                <input type="email" required placeholder="Email Address" className="w-full bg-white/80 border border-white/40 rounded-2xl px-5 py-4 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-[#ff4d6d]/10 focus:border-[#ff4d6d] transition-all font-medium shadow-sm"
                                    value={email} onChange={e => setEmail(e.target.value)} />
                                <div className="md:col-span-2 space-y-2">
                                    <div className="relative">
                                        <input type={showPassword ? "text" : "password"} required placeholder="Password" className="w-full bg-white/80 border border-white/40 rounded-2xl px-5 py-4 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-[#ff4d6d]/10 focus:border-[#ff4d6d] transition-all font-medium shadow-sm"
                                            value={password} onChange={e => setPassword(e.target.value)} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#ff4d6d] transition-colors focus:outline-none">
                                            {showPassword ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.882 9.882L5.146 5.147m3.344 3.344l3.536 3.536m3.537 3.537L20.854 20.854" /></svg>
                                            )}
                                        </button>
                                    </div>
                                    {/* Strength Meter */}
                                    <div className="px-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Strength: {strength.label}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                            <div className={`h-full ${strength.color} transition-all duration-500 ease-out`} style={{ width: `${(strength.score / 4) * 100}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Anti-Robot CAPTCHA Row */}
                                <div className="md:col-span-2 pt-2">
                                    <div className="flex items-center space-x-3 bg-white/40 border border-white/60 p-2 rounded-2xl">
                                        <div className="flex-shrink-0 bg-primary-100 text-primary-500 font-extrabold text-lg px-4 py-3 rounded-xl shadow-inner tracking-widest whitespace-nowrap">
                                            {captcha.a} + {captcha.b} =
                                        </div>
                                        <input type="number" required placeholder="?" className="w-full bg-white/80 border border-white/40 rounded-xl px-5 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#ff4d6d]/10 focus:border-[#ff4d6d] transition-all font-bold text-center text-lg"
                                            value={captchaAnswer} onChange={e => setCaptchaAnswer(e.target.value)} />
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center mt-2">Anti-Bot Verification</p>
                                </div>
                            </div>

                            {/* Terms */}
                            <label className="flex items-center space-x-3 cursor-pointer group px-2 pt-2">
                                <input type="checkbox" className="w-5 h-5 rounded border-white shadow-sm text-[#ff4d6d] focus:ring-[#ff4d6d]"
                                    checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                                <span className="text-xs text-gray-600 font-medium group-hover:text-gray-800 transition-colors">I agree to the <span className="text-[#ff4d6d] font-bold">Terms & Conditions</span> and Privacy Policy.</span>
                            </label>

                            <button type="submit" disabled={loading}
                                className="w-full bg-gradient-to-r from-[#ff4d6d] to-[#ff85a1] hover:scale-[1.02] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#ff4d6d]/20 transition-all active:scale-[0.98] disabled:opacity-70 text-lg uppercase tracking-widest mt-2">
                                {loading ? "Establishing Duo Connection..." : "Create Duo Account"}
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
                                <h3 className="text-2xl font-black text-gray-800 italic">Welcome Aboard!</h3>
                                <p className="text-gray-600 text-sm font-medium px-4">Account verified via Anti-Bot protocol. Redirecting to your Duo interface to sign in...</p>
                            </div>
                        </div>
                    )}

                    <div className="text-center pt-4">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                            Already a Duo? <Link to="/login" className="text-[#ff4d6d] hover:underline">Sign In</Link>
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
                .animate-shake { animation: shake 0.4s ease-in-out; }
            `}</style>
        </div>
    );
};

export default Register;
