import { Link } from 'react-router-dom';
import { useState } from 'react';

const Landing = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#fff0f3] text-gray-800 font-sans selection:bg-[#ff4d6d]/30 selection:text-[#ff4d6d] overflow-x-hidden">
            {/* Background Layer */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#fff0f3] via-transparent to-[#fff0f3]/80"></div>
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/30 border-b border-white/40 px-5 py-3.5">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    {/* Logo */}
                    <div className="flex items-center space-x-2.5 group cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-tr from-[#ff4d6d] to-[#ff85a1] rounded-xl flex items-center justify-center shadow-lg shadow-[#ff4d6d]/20 relative flex-shrink-0">
                            <span className="text-white text-xl font-black italic">C</span>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[#ff4d6d] shadow-sm">
                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                            </div>
                        </div>
                        <span className="text-xl font-black tracking-tight text-gray-800">ChatSphare <span className="text-[#ff4d6d]">Duo</span></span>
                    </div>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center space-x-10 text-sm font-bold uppercase tracking-widest text-gray-600">
                        <a href="#features" className="hover:text-[#ff4d6d] transition-colors">Shared Moments</a>
                        <a href="#security" className="hover:text-[#ff4d6d] transition-colors">Privacy</a>
                    </div>

                    {/* Desktop CTA */}
                    <Link to="/login" className="hidden md:block bg-[#ff4d6d] text-white px-7 py-2.5 rounded-2xl font-black shadow-lg shadow-[#ff4d6d]/20 hover:scale-105 transition-all active:scale-95 text-sm">
                        ENTER SPACE
                    </Link>

                    {/* Mobile: Enter Space + Hamburger */}
                    <div className="flex md:hidden items-center space-x-3">
                        <Link to="/login" className="bg-[#ff4d6d] text-white px-4 py-2 rounded-xl font-black shadow-lg shadow-[#ff4d6d]/20 text-xs">
                            ENTER
                        </Link>
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="w-9 h-9 bg-white/60 border border-white/60 rounded-xl flex items-center justify-center text-gray-700 shadow-sm"
                            aria-label="Toggle menu"
                        >
                            {menuOpen ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Menu */}
                {menuOpen && (
                    <div className="md:hidden mt-3 mx-1 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-xl overflow-hidden">
                        <div className="px-5 py-4 space-y-1">
                            <a href="#features" onClick={() => setMenuOpen(false)} className="flex items-center py-3 px-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-[#ff4d6d]/10 hover:text-[#ff4d6d] transition-colors">
                                <svg className="w-4 h-4 mr-3 text-[#ff4d6d]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                Shared Moments
                            </a>
                            <a href="#security" onClick={() => setMenuOpen(false)} className="flex items-center py-3 px-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-[#ff4d6d]/10 hover:text-[#ff4d6d] transition-colors">
                                <svg className="w-4 h-4 mr-3 text-[#ff4d6d]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                Privacy
                            </a>
                            <div className="pt-2 border-t border-gray-200/60">
                                <Link to="/register" onClick={() => setMenuOpen(false)} className="flex items-center justify-center w-full py-3 bg-[#ff4d6d] text-white rounded-xl font-black text-sm shadow-md shadow-[#ff4d6d]/20 mt-2">
                                    START OUR JOURNEY
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="relative pt-28 pb-16 px-5 z-10">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/40 border border-white/60 text-[#ff4d6d] text-xs font-black tracking-[0.15em] mb-8 shadow-sm animate-bounce">
                        ❤️ BUILT FOR THE TWO OF YOU
                    </div>

                    <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black text-gray-900 leading-[1] tracking-tighter mb-8">
                        The Private Way{' '}
                        <br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff4d6d] via-[#ff85a1] to-[#ff4d6d]">to Stay Close.</span>
                    </h1>

                    <p className="max-w-xl text-base sm:text-lg md:text-xl text-gray-600 font-medium mb-10 px-2">
                        ChatSphare Duo is your intimate, secure, and beautiful shared space. No noise, just you and your favorite person.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <Link to="/register" className="px-8 py-4 bg-[#ff4d6d] text-white text-base font-black rounded-3xl shadow-2xl shadow-[#ff4d6d]/30 hover:scale-105 transition-all text-center">
                            START OUR JOURNEY
                        </Link>
                        <a href="#features" className="px-8 py-4 bg-white/40 backdrop-blur-xl border border-white/60 text-gray-800 text-base font-black rounded-3xl hover:bg-white/60 transition-all text-center">
                            LEARN MORE
                        </a>
                    </div>
                </div>
            </section>

            {/* Feature Highlights */}
            <section id="features" className="relative py-16 px-5 z-10">
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="p-8 rounded-[2rem] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-xl hover:translate-y-[-4px] transition-all group">
                        <div className="w-14 h-14 bg-[#ff4d6d]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7 text-[#ff4d6d]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        </div>
                        <h3 className="text-xl font-black mb-3">Duo Space</h3>
                        <p className="text-gray-600 font-medium leading-relaxed text-sm">A dedicated environment for your relationship. Share chats, photos, and milestones in a beautiful private feed.</p>
                    </div>

                    <div className="p-8 rounded-[2rem] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-xl hover:translate-y-[-4px] transition-all group">
                        <div className="w-14 h-14 bg-[#ff85a1]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7 text-[#ff85a1]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <h3 className="text-xl font-black mb-3">Total Privacy</h3>
                        <p className="text-gray-600 font-medium leading-relaxed text-sm">Military-grade encryption ensures that what happens in your Duo Space, stays in your Duo Space.</p>
                    </div>

                    <div className="p-8 rounded-[2rem] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-xl hover:translate-y-[-4px] transition-all group sm:col-span-2 md:col-span-1">
                        <div className="w-14 h-14 bg-yellow-400/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <h3 className="text-xl font-black mb-3">Instant Spark</h3>
                        <p className="text-gray-600 font-medium leading-relaxed text-sm">Optimized for speed. Zero delays, zero friction. Stay in sync with every heartbeat, instantly.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto px-5 py-10 border-t border-gray-300/50 text-center text-gray-500 text-sm font-medium">
                © 2026 ChatSphare Duo. Built for love and security.
            </footer>
        </div>
    );
};

export default Landing;
