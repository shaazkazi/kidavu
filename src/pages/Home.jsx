// Complete the Home component with the calculateAge helper function
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FiBarChart2, FiCheckSquare, FiCalendar, FiBook } from 'react-icons/fi';

// Helper function to calculate age in months/years
const calculateAge = (birthDate) => {
  const birth = new Date(birthDate);
  const today = new Date();
  
  let months = (today.getFullYear() - birth.getFullYear()) * 12;
  months -= birth.getMonth();
  months += today.getMonth();
  
  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  } else {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths > 0 ? `and ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''}`;
  }
};

const Home = () => {
  const { user } = useAuth();
  const [babyData, setBabyData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchBabyData = async () => {
      try {
        // Fetch baby profile data
        const { data, error } = await supabase
          .from('baby_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        setBabyData(data);
      } catch (error) {
        console.error('Error fetching baby data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBabyData();
  }, [user]);
  
  const modules = [
    {
      title: 'Growth Tracker',
      description: 'Track height, weight and head circumference',
      icon: <FiBarChart2 className="h-6 w-6" />,
      path: '/growth',
      color: 'bg-blue-500',
    },
    {
      title: 'Milestone Tracker',
      description: 'Record developmental milestones',
      icon: <FiCheckSquare className="h-6 w-6" />,
      path: '/milestones',
      color: 'bg-purple-500',
    },
    {
      title: 'Vaccination Schedule',
      description: 'Keep track of vaccines and appointments',
      icon: <FiCalendar className="h-6 w-6" />,
      path: '/vaccinations',
      color: 'bg-green-500',
    },
    {
      title: 'Daily Journal',
      description: 'Document daily activities and memories',
      icon: <FiBook className="h-6 w-6" />,
      path: '/journal',
      color: 'bg-yellow-500',
    },
  ];
  
  // Animation variants for staggered animations
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="container mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Welcome to Kidavu</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Track and celebrate your baby's development journey
        </p>
      </motion.div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
        </div>
      ) : babyData ? (
        <div className="mb-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white"
          >
            <h2 className="text-xl font-semibold">{babyData.name}'s Dashboard</h2>
            <p className="text-primary-100">Age: {calculateAge(babyData.date_of_birth)}</p>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-sm">Weight</p>
                <p className="text-lg font-bold">{babyData.current_weight || '--'} kg</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-sm">Height</p>
                <p className="text-lg font-bold">{babyData.current_height || '--'} cm</p>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card mb-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
        >
          <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400">Add Your Baby's Profile</h2>
          <p className="text-yellow-700 dark:text-yellow-300">Complete your baby's profile to unlock all features.</p>
          <Link to="/settings" className="mt-3 inline-block btn-primary">
            Add Profile
          </Link>
        </motion.div>
      )}
      
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {modules.map((module) => (
          <motion.div key={module.path} variants={item}>
            <Link to={module.path} className="block">
              <div className="card hover:shadow-lg transition-all duration-300 flex items-start">
                <div className={`rounded-full ${module.color} p-3 text-white mr-4`}>
                  {module.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{module.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{module.description}</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Home;
