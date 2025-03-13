import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { 
  FiHome, 
  FiTrendingUp, 
  FiFlag, 
  FiCalendar, 
  FiBook, 
  FiSettings, 
  FiMenu, 
  FiX,
  FiUser
} from 'react-icons/fi';

const Layout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [babyProfile, setBabyProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBabyProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('baby_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') throw error;
        setBabyProfile(data || null);
      } catch (error) {
        console.error('Error fetching baby profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBabyProfile();
  }, [user, location.pathname]);
  
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: <FiHome /> },
    { path: '/growth', label: 'Growth', icon: <FiTrendingUp /> },
    { path: '/milestones', label: 'Milestones', icon: <FiFlag /> },
    { path: '/vaccinations', label: 'Vaccinations', icon: <FiCalendar /> },
    { path: '/journal', label: 'Journal', icon: <FiBook /> },
    { path: '/settings', label: 'Settings', icon: <FiSettings /> },
  ];
  
  // Redirect to settings if no baby profile
  useEffect(() => {
    if (!loading && !babyProfile && location.pathname !== '/settings') {
      navigate('/settings');
    }
  }, [babyProfile, loading, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">BabyTracker</h1>
            {babyProfile && (
              <div className="mt-4 flex items-center">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {babyProfile.avatar_url ? (
                    <img 
                      src={babyProfile.avatar_url} 
                      alt={babyProfile.name} 
                      className="w-10 h-10 object-cover rounded-full"
                    />
                  ) : (
                    <FiUser className="text-gray-400" />
                  )}
                </div>
                <div className="ml-3">
                  <p className="font-medium">{babyProfile.name}</p>
                </div>
              </div>
            )}
          </div>
          
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {navigationItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">BabyTracker</h1>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          >
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden fixed inset-0 z-40 bg-gray-900/50 dark:bg-black/50"
          onClick={closeMobileMenu}
        >
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            className="absolute top-0 left-0 h-full w-3/4 max-w-xs bg-white dark:bg-gray-800 p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {babyProfile && (
              <div className="mb-6 flex items-center">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {babyProfile.avatar_url ? (
                    <img 
                      src={babyProfile.avatar_url} 
                      alt={babyProfile.name} 
                      className="w-10 h-10 object-cover rounded-full"
                    />
                  ) : (
                    <FiUser className="text-gray-400" />
                  )}
                </div>
                <div className="ml-3">
                  <p className="font-medium">{babyProfile.name}</p>
                </div>
              </div>
            )}
            
            <ul className="space-y-1">
              {navigationItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
      
      {/* Main content */}
      <div className="md:pl-64 pt-16 md:pt-0">
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
