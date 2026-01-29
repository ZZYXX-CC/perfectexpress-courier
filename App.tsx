import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Hero from './components/Hero';
import Dashboard from './components/Dashboard';
import Features from './components/Features';
import { ProcessSection, TestimonialsSection, CTASection } from './components/HomeSections';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';
import ShipmentDetails from './components/ShipmentDetails';
import TrackingPage from './components/TrackingPage';
import QuoteSection from './components/QuoteSection';
import ScrollToTop from './components/ScrollToTop';
import FAQSection from './components/FAQSection';
import LoginPage from './components/Auth/LoginPage';
import SignUpPage from './components/Auth/SignUpPage';
import ForgotPasswordPage from './components/Auth/ForgotPasswordPage';
import ResetPasswordPage from './components/Auth/ResetPasswordPage';
import NetworkPage from './components/NetworkPage';
import GuidePage from './components/GuidePage';
import SupportPage from './components/SupportPage';
import LegalPage from './components/LegalPage';
import Loader from './components/Loader';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import UserSettings from './components/UserSettings';
import TicketList from './components/tickets/TicketList';
import TicketDetail from './components/tickets/TicketDetail';
import { Shipment, User } from './types';
import { generateMockShipment, fetchRealShipment } from './services/geminiService';
import { supabase } from './services/supabase';

// Page transition animation
const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.4 }
};

// Protected Route Component
const ProtectedRoute: React.FC<{ user: User | null; isAuthInitializing: boolean; children: React.ReactNode }> = ({ user, isAuthInitializing, children }) => {
  if (isAuthInitializing) {
    return <Loader />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Admin Route Component
const AdminRoute: React.FC<{ user: User | null; isAuthInitializing: boolean; children: React.ReactNode }> = ({ user, isAuthInitializing, children }) => {
  if (isAuthInitializing) {
    return <Loader />;
  }
  if (!user || user.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

// Main App Content (needs to be inside Router for useNavigate)
const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeShipment, setActiveShipment] = useState<Shipment | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Initial Auth Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncUser(session.user).finally(() => setIsAuthInitializing(false));
      } else {
        setIsAuthInitializing(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await syncUser(session.user);
      } else {
        setUser(null);
      }
      setIsAuthInitializing(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncUser = async (supabaseUser: any) => {
    console.log('🔍 Syncing user for:', supabaseUser.email, 'ID:', supabaseUser.id);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('❌ Error fetching profile:', error);
        // Only create profile if it truly doesn't exist (PGRST116 = not found)
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          console.log('📝 Creating new profile for user');
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: supabaseUser.id,
              email: supabaseUser.email,
              full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
              role: 'client'
            })
            .select()
            .single();
          
          if (insertError) {
            console.error('❌ Error creating profile:', insertError);
          }
          
          if (newProfile) {
            const newUser = {
              name: newProfile.full_name || supabaseUser.email?.split('@')[0].toUpperCase(),
              email: supabaseUser.email || '',
              role: 'Client'
            };
            console.log('✅ Created new user profile:', newUser);
            setUser(newUser);
            return;
          }
        } else {
          // For other errors, log and use fallback
          console.error('❌ Unexpected error fetching profile:', error);
        }
      }

      if (!profile) {
        console.warn('⚠️ No profile found, using fallback Client role');
        setUser({
          name: supabaseUser.email?.split('@')[0].toUpperCase() || 'CLIENT',
          email: supabaseUser.email || '',
          role: 'Client'
        });
        return;
      }

      console.log('📋 Profile data returned:', profile);
      console.log('🔑 Profile role value:', profile.role, 'Type:', typeof profile.role);

      // Check role - handle both 'admin' and 'Admin' cases, and null/undefined
      const roleValue = profile.role || '';
      const roleLower = String(roleValue).toLowerCase().trim();
      const isAdmin = roleLower === 'admin';
      
      console.log('🔄 Role after processing:', roleLower, 'Is admin?', isAdmin);
      
      const newUser = {
        name: profile.full_name || supabaseUser.email?.split('@')[0].toUpperCase(),
        email: supabaseUser.email || '',
        role: isAdmin ? 'Admin' : 'Client'
      };
      
      console.log('✅ Setting user state to:', newUser);
      console.log('   - Original role from DB:', profile.role);
      console.log('   - Processed role:', roleLower);
      console.log('   - Final role:', newUser.role);
      
      setUser(newUser);
    } catch (error) {
      console.error('❌ Unexpected error in syncUser:', error);
      // Basic fallback
      setUser({
        name: supabaseUser.email?.split('@')[0].toUpperCase() || 'USER',
        email: supabaseUser.email || '',
        role: 'Client'
      });
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleTrack = async (id: string) => {
    setIsLoading(true);
    const shipment = await fetchRealShipment(id);
    if (shipment) {
      setActiveShipment(shipment);
      navigate(`/track/${id}`);
    } else {
      console.error("Shipment not found");
    }
    setIsLoading(false);
    return shipment;
  };

  const handleLogin = async (email: string) => {
    // Navigate immediately - onAuthStateChange will sync user in background
    // This prevents the login page from hanging
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  // Helper for page navigation (for backward compatibility with components using setPage)
  const handlePageChange = (page: string) => {
    switch (page) {
      case 'home': navigate('/'); break;
      case 'about': navigate('/about'); break;
      case 'tracking': navigate('/tracking'); break;
      case 'quotes': navigate('/quotes'); break;
      case 'login': navigate('/login'); break;
      case 'signup': navigate('/signup'); break;
      case 'forgot-password': navigate('/forgot-password'); break;
      case 'dashboard': navigate('/dashboard'); break;
      case 'settings': navigate('/settings'); break;
      case 'network-na': navigate('/network/na'); break;
      case 'network-eu': navigate('/network/eu'); break;
      case 'network-ap': navigate('/network/ap'); break;
      case 'network-local': navigate('/network/local'); break;
      case 'guide': navigate('/guide'); break;
      case 'support': case 'contact': navigate('/support'); break;
      case 'privacy': navigate('/privacy'); break;
      case 'terms': navigate('/terms'); break;
      case 'cookies': navigate('/cookies'); break;
      default: navigate('/');
    }
  };

  // Get current page name from pathname for Header
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/track/')) return 'shipment_details';
    if (path.startsWith('/network/')) return `network-${path.split('/')[2]}`;
    return path.substring(1).split('/')[0];
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
        onLogoutClick={handleLogout}
      />

      <main>
        <AnimatePresence mode="wait">
          <Routes location={location}>
            {/* Home */}
            <Route path="/" element={
              <motion.div {...pageTransition} key="home">
                <Hero onTrack={handleTrack} />
                <Features />
                <ProcessSection />
                <TestimonialsSection />
                <CTASection onGetQuote={() => navigate('/quotes')} />
              </motion.div>
            } />

            {/* About */}
            <Route path="/about" element={
              <motion.div {...pageTransition} key="about" className="pt-24 min-h-screen bg-bgMain">
                <Dashboard />
                <FAQSection />
              </motion.div>
            } />

            {/* Tracking */}
            <Route path="/tracking" element={
              <motion.div {...pageTransition} key="tracking" className="pt-32 pb-20 container mx-auto px-6 bg-bgMain min-h-screen">
                <div className="text-center mb-12">
                  <span className="text-red-600 font-bold uppercase tracking-[0.3em] text-[10px]">Real-Time Visibility</span>
                  <h1 className="text-4xl md:text-5xl font-black heading-font mt-2 uppercase tracking-tighter text-textMain">Package Tracking</h1>
                </div>
                <Hero onTrack={handleTrack} standalone={true} />
              </motion.div>
            } />

            {/* Track Specific Shipment */}
            <Route path="/track/:id" element={
              <TrackingPage user={user} />
            } />

            {/* Quotes */}
            <Route path="/quotes" element={
              <motion.div {...pageTransition} key="quotes" className="pt-24 min-h-screen bg-bgMain">
                <QuoteSection />
              </motion.div>
            } />

            {/* Auth Routes */}
            <Route path="/login" element={
              <motion.div {...pageTransition} key="login">
                <LoginPage onLogin={handleLogin} onNavigate={handlePageChange} />
              </motion.div>
            } />
            <Route path="/signup" element={
              <motion.div {...pageTransition} key="signup">
                <SignUpPage onLogin={handleLogin} onNavigate={handlePageChange} />
              </motion.div>
            } />
            <Route path="/forgot-password" element={
              <motion.div {...pageTransition} key="forgot-password">
                <ForgotPasswordPage onNavigate={handlePageChange} />
              </motion.div>
            } />
            <Route path="/reset-password" element={
              <motion.div {...pageTransition} key="reset-password">
                <ResetPasswordPage />
              </motion.div>
            } />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute user={user} isAuthInitializing={isAuthInitializing}>
                <motion.div {...pageTransition} key="dashboard">
                  {user?.role === 'Admin' ? (
                    <AdminDashboard user={user} />
                  ) : (
                    <UserDashboard user={user!} onTrack={handleTrack} onNavigate={handlePageChange} />
                  )}
                </motion.div>
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute user={user} isAuthInitializing={isAuthInitializing}>
                <motion.div {...pageTransition} key="settings">
                  <UserSettings onBack={() => navigate('/dashboard')} />
                </motion.div>
              </ProtectedRoute>
            } />

            {/* Ticket Routes (Protected) */}
            <Route path="/dashboard/tickets" element={
              <ProtectedRoute user={user} isAuthInitializing={isAuthInitializing}>
                <motion.div {...pageTransition} key="ticket_list" className="pt-32 pb-20 container mx-auto px-6 bg-bgMain min-h-screen">
                  <div className="max-w-4xl mx-auto">
                    <div className="mb-8 flex items-center justify-between">
                      <h2 className="text-2xl font-black heading-font uppercase text-textMain">Support Tickets</h2>
                      <button onClick={() => navigate('/dashboard')} className="text-textMuted text-xs hover:text-white">Back to Dashboard</button>
                    </div>
                    <TicketList user={user!} />
                  </div>
                </motion.div>
              </ProtectedRoute>
            } />

            <Route path="/dashboard/tickets/:id" element={
              <ProtectedRoute user={user} isAuthInitializing={isAuthInitializing}>
                <motion.div {...pageTransition} key="ticket_detail" className="pt-32 pb-20 container mx-auto px-6 bg-bgMain min-h-screen">
                  <div className="max-w-4xl mx-auto h-[800px]">
                    <TicketDetail />
                  </div>
                </motion.div>
              </ProtectedRoute>
            } />

            {/* Network Pages */}
            <Route path="/network/na" element={<motion.div {...pageTransition} key="network-na"><NetworkPage regionId="na" /></motion.div>} />
            <Route path="/network/eu" element={<motion.div {...pageTransition} key="network-eu"><NetworkPage regionId="eu" /></motion.div>} />
            <Route path="/network/ap" element={<motion.div {...pageTransition} key="network-ap"><NetworkPage regionId="ap" /></motion.div>} />
            <Route path="/network/local" element={<motion.div {...pageTransition} key="network-local"><NetworkPage regionId="local" /></motion.div>} />

            {/* Support & Info Pages */}
            <Route path="/guide" element={<motion.div {...pageTransition} key="guide"><GuidePage /></motion.div>} />
            <Route path="/support" element={<motion.div {...pageTransition} key="support"><SupportPage /></motion.div>} />
            <Route path="/privacy" element={<motion.div {...pageTransition} key="privacy"><LegalPage type="privacy" /></motion.div>} />
            <Route path="/terms" element={<motion.div {...pageTransition} key="terms"><LegalPage type="terms" /></motion.div>} />
            <Route path="/cookies" element={<motion.div {...pageTransition} key="cookies"><LegalPage type="cookies" /></motion.div>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>

      <Footer setPage={handlePageChange} />
      <ChatBot />
      <ScrollToTop />
    </div >
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
