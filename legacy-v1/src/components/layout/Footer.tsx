import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Footer = () => {
    return (
        <footer className="bg-slate-950 text-slate-300 pt-20 pb-10">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <span className="text-white font-bold text-xl">P</span>
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white">
                                PerfectExpress
                            </span>
                        </div>
                        <p className="text-sm leading-relaxed max-w-xs">
                            Delivering reliability and speed across the globe. Your trusted partner in logistics and supply chain management.
                        </p>
                        <div className="flex gap-4">
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                <a key={i} href="#" className="hover:text-primary transition-colors">
                                    <Icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-6">Services</h3>
                        <ul className="space-y-3 text-sm">
                            {['Air Freight', 'Ocean Shipping', 'Road Transport', 'Warehousing', 'Supply Chain'].map((item) => (
                                <li key={item}>
                                    <Link href="#" className="hover:text-primary transition-colors">{item}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-6">Company</h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="#company" className="hover:text-primary transition-colors">About Us</Link>
                            </li>
                            <li>
                                <Link href="/support" className="hover:text-primary transition-colors">Support Center</Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="text-white font-semibold mb-6">Newsletter</h3>
                        <p className="text-sm mb-4">Subscribe to our newsletter for the latest updates and offers.</p>
                        <div className="relative">
                            <Input
                                placeholder="Enter your email"
                                className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-primary rounded-full pr-12 h-12"
                            />
                            <Button
                                size="icon"
                                className="absolute right-1 top-1 h-10 w-10 !rounded-full bg-primary hover:bg-primary/90"
                            >
                                <Send size={16} />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p>© {new Date().getFullYear()} PerfectExpress Courier. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="#" className="hover:text-white">Terms</Link>
                        <Link href="#" className="hover:text-white">Privacy</Link>
                        <Link href="#" className="hover:text-white">Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
