import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface HeaderProps {
  currentPage: string;
  setPage: (page: string) => void;
  theme: string;
  toggleTheme: () => void;
  currentUser: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, setPage, theme, toggleTheme, currentUser, onLoginClick, onLogoutClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', id: 'home' },
    { name: 'About', id: 'about' },
    { name: 'Tracking', id: 'tracking' },
    { name: 'Shipping Quote', id: 'quotes' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${isScrolled ? 'py-4 bg-bgMain/90 backdrop-blur-xl border-b border-borderColor shadow-2xl' : 'py-7 bg-transparent'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setPage('home')}
        >
          <div className="w-9 h-9 bg-bgSurface border border-borderColor rounded-sm flex items-center justify-center group-hover:border-red-600 transition-colors text-textMain">
            <iconify-icon icon="solar:delivery-linear" width="20" class="text-textMuted group-hover:text-red-600 transition-colors"></iconify-icon>
          </div>
          <span className="text-xl font-extrabold tracking-tighter heading-font uppercase text-textMain">Perfect<span className="text-red-600">Express</span></span>
        </div>
        
        {/* Desktop Nav */}
        <nav className="hidden lg:flex gap-10">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`metadata-label transition-all duration-300 ${currentPage === item.id ? 'text-red-600' : 'text-textMuted hover:text-textMain'}`}
            >
              {item.name}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-sm bg-bgSurface border border-borderColor text-textMuted hover:text-textMain transition-colors"
          >
             <iconify-icon icon={theme === 'dark' ? "solar:sun-linear" : "solar:moon-linear"} width="16"></iconify-icon>
          </button>

          {currentUser ? (
            <div className="hidden sm:flex items-center gap-3">
               <button 
                  onClick={() => setPage('dashboard')}
                  className={`hidden md:block px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${currentPage === 'dashboard' ? 'text-red-600' : 'text-textMuted hover:text-textMain'}`}
               >
                 Dashboard
               </button>
               <div className="w-[1px] h-6 bg-borderColor hidden md:block"></div>
               <div className="text-right hidden md:block">
                  <p className="text-[9px] font-black uppercase tracking-widest text-textMain">{currentUser.name}</p>
                  <p className="text-[8px] font-bold text-red-600 uppercase tracking-widest">{currentUser.role}</p>
               </div>
               <button 
                 onClick={onLogoutClick}
                 className="px-6 py-2 bg-bgSurface border border-borderColor text-textMuted hover:text-textMain hover:border-red-600 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95"
               >
                 Logout
               </button>
            </div>
          ) : (
            <button 
              onClick={onLoginClick}
              className={`hidden sm:flex items-center gap-2 px-6 py-2 bg-textMain text-bgMain hover:opacity-90 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 ${currentPage === 'login' ? 'opacity-50 cursor-default' : ''}`}
            >
              Client Login
            </button>
          )}
          
          <button 
            className="lg:hidden p-2 text-textMuted"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <iconify-icon icon={isMobileMenuOpen ? "solar:close-circle-linear" : "solar:hamburger-menu-linear"} width="24"></iconify-icon>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-bgMain border-b border-borderColor p-10 shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="flex flex-col gap-8">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setPage(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`text-left metadata-label text-xs ${currentPage === item.id ? 'text-red-600' : 'text-textMuted'}`}
              >
                {item.name}
              </button>
            ))}
            <div className="h-px bg-borderColor w-full my-2"></div>
            {currentUser ? (
              <>
                 <button
                   onClick={() => {
                     setPage('dashboard');
                     setIsMobileMenuOpen(false);
                   }}
                   className={`text-left metadata-label text-xs ${currentPage === 'dashboard' ? 'text-red-600' : 'text-textMuted'}`}
                 >
                   Dashboard
                 </button>
                 <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-textMain">{currentUser.name}</p>
                    <p className="text-[8px] font-bold text-red-600 uppercase tracking-widest">{currentUser.role}</p>
                 </div>
                 <button 
                   onClick={() => {
                     onLogoutClick();
                     setIsMobileMenuOpen(false);
                   }}
                   className="w-full py-4 bg-bgSurface border border-borderColor text-textMuted hover:text-textMain font-black uppercase tracking-widest rounded-sm text-xs"
                 >
                   Logout
                 </button>
              </>
            ) : (
              <button 
                onClick={() => {
                  onLoginClick();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-4 bg-textMain text-bgMain font-black uppercase tracking-widest rounded-sm text-xs"
              >
                Client Login
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;