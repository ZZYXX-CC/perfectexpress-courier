'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, User, LogOut, LayoutDashboard, Shield, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                supabase.from('profiles').select('*').eq('id', session.user.id).single()
                    .then(({ data }) => setProfile(data));
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                supabase.from('profiles').select('*').eq('id', session.user.id).single()
                    .then(({ data }) => setProfile(data));
            } else {
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    return (
        <nav
            className={cn(
                'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
                isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'
            )}
        >
            <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-white font-bold text-xl">P</span>
                    </div>
                    <span className={cn("text-xl font-bold tracking-tight", isScrolled ? "text-slate-800" : "text-white")}>
                        PerfectExpress
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {['Services', 'Tracking', 'Company', 'Support'].map((item) => (
                        <Link
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className={cn(
                                "text-sm font-medium transition-colors",
                                isScrolled 
                                    ? "text-slate-600 hover:text-primary" 
                                    : "text-slate-300 hover:text-white"
                            )}
                        >
                            {item}
                        </Link>
                    ))}
                </div>

                {/* CTA / User Menu */}
                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary hover:bg-primary/90 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-medium text-white max-w-[120px] truncate">
                                    {profile?.full_name || user.email?.split('@')[0]}
                                </span>
                            </button>

                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                                    {profile?.role !== 'admin' && (
                                        <Link
                                            href="/dashboard"
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <LayoutDashboard size={16} />
                                            Dashboard
                                        </Link>
                                    )}
                                    {profile?.role === 'admin' && (
                                        <Link
                                            href="/admin"
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <Shield size={16} />
                                            Admin Panel
                                        </Link>
                                    )}
                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <Settings size={16} />
                                        Profile Settings
                                    </Link>
                                    <hr className="my-2 border-slate-100" />
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                    >
                                        <LogOut size={16} />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link href="/auth/login">
                                <Button variant="ghost" className={cn(
                                    "font-semibold hover:bg-transparent",
                                    isScrolled ? "text-slate-700 hover:text-primary" : "text-white hover:text-primary"
                                )}>
                                    Log In
                                </Button>
                            </Link>
                            <Link href="/ship">
                                <Button>Get a Quote</Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    className={cn("md:hidden", isScrolled ? "text-slate-800" : "text-white")}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-4 flex flex-col gap-4 shadow-lg">
                    {['Services', 'Tracking', 'Company', 'Support'].map((item) => (
                        <Link
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className="text-sm font-medium text-slate-600 hover:text-primary transition-colors py-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {item}
                        </Link>
                    ))}
                    <div className="flex flex-col gap-3 mt-2">
                        {user ? (
                            <>
                                {profile?.role !== 'admin' && (
                                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button variant="ghost" className="w-full justify-start text-slate-700 hover:text-primary">
                                            <LayoutDashboard className="mr-2" size={16} />
                                            Dashboard
                                        </Button>
                                    </Link>
                                )}
                                {profile?.role === 'admin' && (
                                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button variant="ghost" className="w-full justify-start text-slate-700 hover:text-primary">
                                            <Shield className="mr-2" size={16} />
                                            Admin Panel
                                        </Button>
                                    </Link>
                                )}
                                <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button variant="ghost" className="w-full justify-start text-slate-700 hover:text-primary">
                                        <Settings className="mr-2" size={16} />
                                        Profile Settings
                                    </Button>
                                </Link>
                                <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleSignOut}>
                                    <LogOut className="mr-2" size={16} />
                                    Sign Out
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button variant="ghost" className="w-full justify-start text-slate-700 hover:text-primary">Log In</Button>
                                </Link>
                                <Link href="/ship" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button className="w-full">Get a Quote</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
