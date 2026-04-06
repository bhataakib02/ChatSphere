import { Link } from 'react-router-dom';

const Landing = () => {
    return (
        <div className="min-h-screen bg-[#fff0f3] text-gray-800 font-sans selection:bg-[#ff4d6d]/30 selection:text-[#ff4d6d] overflow-x-hidden">
            {/* Background Image Layer */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#fff0f3] via-transparent to-[#fff0f3]/80"></div>
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/30 border-b border-white/40 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3 group cursor-pointer">
                        <div className="w-12 h-12 bg-gradient-to-tr from-[#ff4d6d] to-[#ff85a1] rounded-2xl flex items-center justify-center shadow-lg shadow-[#ff4d6d]/20 relative">
                            <span className="text-white text-2xl font-black italic">C</span>
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center text-[#ff4d6d] shadow-sm group-hover:scale-110 transition-transform">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                            </div>
                        </div>
                        <span className="text-2xl font-black tracking-tight text-gray-800">ChatSphere <span className="text-[#ff4d6d]">Duo</span></span>
                    </div>
                    <div className="hidden md:flex items-center space-x-10 text-sm font-bold uppercase tracking-widest text-gray-600">
                        <a href="#features" className="hover:text-[#ff4d6d] transition-colors">Shared Moments</a>
                        <a href="#security" className="hover:text-[#ff4d6d] transition-colors">Privacy</a>
                    </div>
                    <Link to="/login" className="bg-[#ff4d6d] text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-[#ff4d6d]/20 hover:scale-105 transition-all active:scale-95">
                        ENTER SPACE
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 z-10">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/40 border border-white/60 text-[#ff4d6d] text-xs font-black tracking-[0.2em] mb-10 shadow-sm animate-bounce">
                        ❤️ BUILT FOR THE TWO OF YOU
                    </div>

                    <h1 className="text-7xl md:text-9xl font-black text-gray-900 leading-[0.9] tracking-tighter mb-10">
                        The Private Way <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff4d6d] via-[#ff85a1] to-[#ff4d6d]">to Stay Close.</span>
                    </h1>

                    <p className="max-w-2xl text-xl md:text-2xl text-gray-600 font-medium mb-12">
                        ChatSphere Duo is your intimate, secure, and beautiful shared space. No noise, just you and your favorite person.
                    </p>

                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                        <Link to="/register" className="px-12 py-5 bg-[#ff4d6d] text-white text-lg font-black rounded-3xl shadow-2xl shadow-[#ff4d6d]/30 hover:scale-105 transition-all">
                            START OUR JOURNEY
                        </Link>
                        <button className="px-12 py-5 bg-white/40 backdrop-blur-xl border border-white/60 text-gray-800 text-lg font-black rounded-3xl hover:bg-white/60 transition-all">
                            LEARN MORE
                        </button>
                    </div>
                </div>
            </section>

            {/* Feature Highlights */}
            <section id="features" className="relative py-20 px-6 z-10">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-10 rounded-[2.5rem] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-xl hover:translate-y-[-5px] transition-all group">
                        <div className="w-16 h-16 bg-[#ff4d6d]/10 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-[#ff4d6d]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        </div>
                        <h3 className="text-2xl font-black mb-4">Duo Space</h3>
                        <p className="text-gray-600 font-medium leading-relaxed">A dedicated environment for your relationship. Share chats, photos, and milestones in a beautiful private feed.</p>
                    </div>

                    <div className="p-10 rounded-[2.5rem] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-xl hover:translate-y-[-5px] transition-all group">
                        <div className="w-16 h-16 bg-[#ff85a1]/10 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-[#ff85a1]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <h3 className="text-2xl font-black mb-4">Total Privacy</h3>
                        <p className="text-gray-600 font-medium leading-relaxed">Military-grade E2EE encryption ensures that what happens in your Duo Space, stays in your Duo Space.</p>
                    </div>

                    <div className="p-10 rounded-[2.5rem] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-xl hover:translate-y-[-5px] transition-all group">
                        <div className="w-16 h-16 bg-[#c0ca33]/10 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-[#c0ca33]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <h3 className="text-2xl font-black mb-4">Instant Spark</h3>
                        <p className="text-gray-600 font-medium leading-relaxed">Optimized for speed. Zero delays, zero friction. Stay in sync with every heartbeat, instantly.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-300/50 text-center text-gray-500 text-sm font-medium">
                © 2026 ChatSphere Duo. Built for love and security.
            </footer>
        </div>
    );
};

export default Landing;
