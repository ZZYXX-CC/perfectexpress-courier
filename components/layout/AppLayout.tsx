import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Header from '../Header';
import Footer from '../Footer';
import ChatBot from '../ChatBot';
import ScrollToTop from '../ScrollToTop';
import Loader from '../Loader';
import { User } from '../../types';

interface AppLayoutProps {
    theme: string;
    toggleTheme: () => void;
    user: User | null;
    onLogout: () => void;
    isLoading: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({
    theme,
    toggleTheme,
    user,
    onLogout,
    isLoading
}) => {
    const location = useLocation();
    const navigate = useNavigate();

    // Helper to map current path to "currentPage" logic for the Header
    // simple mapping: / -> home, /about -> about, etc.
    const getCurrentPage = () => {
        const path = location.pathname;
        if (path === '/') return 'home';
        return path.substring(1).split('/')[0]; // e.g. "dashboard" from "/dashboard/settings"
    };

    const handlePageChange = (page: string) => {
        // Map internal "page" strings to routes
        switch (page) {
            case 'home': navigate('/'); break;
            case 'about': navigate('/about'); break;
            case 'tracking': navigate('/tracking'); break;
            case 'quotes': navigate('/quotes'); break;
            case 'login': navigate('/login'); break;
            case 'signup': navigate('/signup'); break;
            case 'forgot-password': navigate('/forgot-password'); break;
            case 'dashboard': navigate('/dashboard'); break;
            case 'settings': navigate('/dashboard/settings'); break;
            case 'shipment_details': navigate('/track'); break; // Generic track or specific?
            case 'network-na': navigate('/network/na'); break;
            case 'network-eu': navigate('/network/eu'); break;
            case 'network-ap': navigate('/network/ap'); break;
            case 'network-local': navigate('/network/local'); break;
            case 'guide': navigate('/guide'); break;
            case 'support': navigate('/support'); break;
            case 'contact': navigate('/support'); break;
            case 'privacy': navigate('/privacy'); break;
            case 'terms': navigate('/terms'); break;
            case 'cookies': navigate('/cookies'); break;
            default: navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-bgMain text-textMain selection:bg-red-600/30 font-sans transition-colors duration-300">
            <AnimatePresence>
                {isLoading && <Loader key="loader" />}
            </AnimatePresence>

            <Header
                currentPage={getCurrentPage()}
                setPage={handlePageChange}
                theme={theme}
                toggleTheme={toggleTheme}
                currentUser={user}
                onLoginClick={() => navigate('/login')}
                onLogoutClick={onLogout}
            />

            <main>
                <AnimatePresence mode="wait">
                    {/* We pass logic to child routes via Outlet context if needed, 
              but typically Routes navigate themselves. 
              Framer Motion needs key to animate transitions. */}
                    <Outlet />
                </AnimatePresence>
            </main>

            <Footer setPage={handlePageChange} />
            <ChatBot />
            <ScrollToTop />
        </div>
    );
};

export default AppLayout;
