import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Hero from './components/Hero';
import Dashboard from './components/Dashboard';
import Features from './components/Features';
import { ProcessSection, TestimonialsSection, CTASection } from './components/HomeSections';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';
import ShipmentDetails from './components/ShipmentDetails';
import QuoteSection from './components/QuoteSection';
import ScrollToTop from './components/ScrollToTop';
import FAQSection from './components/FAQSection';
import LoginPage from './components/Auth/LoginPage';
import SignUpPage from './components/Auth/SignUpPage';
import ForgotPasswordPage from './components/Auth/ForgotPasswordPage';
import NetworkPage from './components/NetworkPage';
import GuidePage from './components/GuidePage';
import SupportPage from './components/SupportPage';
import LegalPage from './components/LegalPage';
import Loader from './components/Loader';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import UserSettings from './components/UserSettings';
import { Shipment, User } from './types';
import { generateMockShipment } from './services/geminiService';

const App: React.FC = () => {
  const [activeShipment, setActiveShipment] = useState<Shipment | null>(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Orchestrate page changes with loading animation and scroll reset
  const handlePageChange = (page: string) => {
    if (page === currentPage) return;
    
    setIsLoading(true);

    // Sequence: Wait for loader fade in -> Switch Page -> Scroll Top -> Fade loader out
    setTimeout(() => {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      // Slight delay to allow the new component to mount before revealing
      setTimeout(() => {
        setIsLoading(false);
      }, 400);
    }, 600);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleTrack = (id: string) => {
    const mock = generateMockShipment(id);
    setActiveShipment(mock);
    handlePageChange('shipment_details');
    return mock;
  };

  const handleLogin = (email: string) => {
    const isAdmin = email.includes('admin');
    const newUser: User = {
      name: email.split('@')[0].toUpperCase(),
      email: email,
      role: isAdmin ? 'Admin' : 'Client'
    };
    setUser(newUser);
    handlePageChange('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    handlePageChange('home');
  };

  const renderContent = () => {
    const pageTransition = {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 },
      transition: { duration: 0.4 }
    };

    switch (currentPage) {
      case 'home':
        return (
          <motion.div {...pageTransition} key="home">
            <Hero onTrack={handleTrack} />
            <Features />
            <ProcessSection />
            <TestimonialsSection />
            <CTASection onGetQuote={() => handlePageChange('quotes')} />
          </motion.div>
        );
      case 'about':
        return (
          <motion.div {...pageTransition} key="about" className="pt-24 min-h-screen bg-bgMain">
             <Dashboard />
             <FAQSection />
          </motion.div>
        );
      case 'tracking':
        return (
          <motion.div {...pageTransition} key="tracking" className="pt-32 pb-20 container mx-auto px-6 bg-bgMain min-h-screen">
            <div className="text-center mb-12">
              <span className="text-red-600 font-bold uppercase tracking-[0.3em] text-[10px]">Real-Time Visibility</span>
              <h1 className="text-4xl md:text-5xl font-black heading-font mt-2 uppercase tracking-tighter text-textMain">Package Tracking</h1>
            </div>
            <Hero onTrack={handleTrack} standalone={true} />
          </motion.div>
        );
      case 'quotes':
        return (
          <motion.div {...pageTransition} key="quotes" className="pt-24 min-h-screen bg-bgMain">
            <QuoteSection />
          </motion.div>
        );
      case 'login':
        return (
          <motion.div {...pageTransition} key="login">
            <LoginPage onLogin={handleLogin} onNavigate={handlePageChange} />
          </motion.div>
        );
      case 'signup':
        return (
          <motion.div {...pageTransition} key="signup">
            <SignUpPage onLogin={handleLogin} onNavigate={handlePageChange} />
          </motion.div>
        );
      case 'forgot-password':
        return (
          <motion.div {...pageTransition} key="forgot-password">
            <ForgotPasswordPage onNavigate={handlePageChange} />
          </motion.div>
        );
      case 'dashboard':
        if (!user) {
          handlePageChange('login');
          return null;
        }
        return (
          <motion.div {...pageTransition} key="dashboard">
             {user.role === 'Admin' ? (
               <AdminDashboard user={user} />
             ) : (
               <UserDashboard user={user} onTrack={handleTrack} onNavigate={handlePageChange} />
             )}
          </motion.div>
        );
      case 'settings':
         if (!user) {
             handlePageChange('login');
             return null;
         }
         return (
             <motion.div {...pageTransition} key="settings">
                 <UserSettings onBack={() => handlePageChange('dashboard')} />
             </motion.div>
         );
      case 'shipment_details':
        if (!activeShipment) {
           handlePageChange(user ? 'dashboard' : 'tracking');
           return null;
        }
        return (
          <motion.div {...pageTransition} key="shipment_details">
            <ShipmentDetails 
              shipment={activeShipment} 
              onBack={() => handlePageChange(user ? 'dashboard' : 'tracking')} 
            />
          </motion.div>
        );
      // New Pages
      case 'network-na': return <motion.div {...pageTransition} key="network-na"><NetworkPage regionId="na" /></motion.div>;
      case 'network-eu': return <motion.div {...pageTransition} key="network-eu"><NetworkPage regionId="eu" /></motion.div>;
      case 'network-ap': return <motion.div {...pageTransition} key="network-ap"><NetworkPage regionId="ap" /></motion.div>;
      case 'network-local': return <motion.div {...pageTransition} key="network-local"><NetworkPage regionId="local" /></motion.div>;
      case 'guide': return <motion.div {...pageTransition} key="guide"><GuidePage /></motion.div>;
      case 'support':
      case 'contact': return <motion.div {...pageTransition} key="support"><SupportPage /></motion.div>;
      case 'privacy': return <motion.div {...pageTransition} key="privacy"><LegalPage type="privacy" /></motion.div>;
      case 'terms': return <motion.div {...pageTransition} key="terms"><LegalPage type="terms" /></motion.div>;
      case 'cookies': return <motion.div {...pageTransition} key="cookies"><LegalPage type="cookies" /></motion.div>;
      default:
        return <Hero onTrack={handleTrack} />;
    }
  };

  return (
    <div className="min-h-screen bg-bgMain text-textMain selection:bg-red-600/30 font-sans transition-colors duration-300">
      <AnimatePresence>
        {isLoading && <Loader key="loader" />}
      </AnimatePresence>
      
      <Header 
        currentPage={currentPage} 
        setPage={handlePageChange} 
        theme={theme} 
        toggleTheme={toggleTheme}
        currentUser={user}
        onLoginClick={() => handlePageChange('login')}
        onLogoutClick={handleLogout}
      />
      
      <main>
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>

      <Footer setPage={handlePageChange} />
      <ChatBot />
      <ScrollToTop />
    </div>
  );
};

export default App;
