import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO, differenceInMonths, differenceInDays, differenceInWeeks } from 'date-fns';
import { FiTrendingUp, FiFlag, FiCalendar, FiBook, FiPlus, FiUser } from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [babyProfile, setBabyProfile] = useState(null);
  const [recentGrowthData, setRecentGrowthData] = useState(null);
  const [recentMilestones, setRecentMilestones] = useState([]);
  const [upcomingVaccinations, setUpcomingVaccinations] = useState([]);
  const [recentJournalEntries, setRecentJournalEntries] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch baby profile
        const { data: profileData, error: profileError } = await supabase
          .from('baby_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        setBabyProfile(profileData || null);
        
        if (profileData) {
          // Fetch recent growth data
          const { data: growthData, error: growthError } = await supabase
            .from('growth_records')
            .select('*')
            .eq('baby_id', profileData.id)
            .order('date', { ascending: false })
            .limit(1)
            .single();
            
          if (growthError && growthError.code !== 'PGRST116') throw growthError;
          setRecentGrowthData(growthData || null);
          
          // Fetch recent milestones
          const { data: milestonesData, error: milestonesError } = await supabase
            .from('milestones')
            .select('*')
            .eq('baby_id', profileData.id)
            .order('date', { ascending: false })
            .limit(3);
            
          if (milestonesError) throw milestonesError;
          setRecentMilestones(milestonesData || []);
          
          // Fetch upcoming vaccinations
          const today = new Date().toISOString().split('T')[0];
          const { data: vaccinationsData, error: vaccinationsError } = await supabase
            .from('vaccinations')
            .select('*')
            .eq('baby_id', profileData.id)
            .is('administered_date', null)
            .gte('scheduled_date', today)
            .order('scheduled_date', { ascending: true })
            .limit(3);
            
          if (vaccinationsError) throw vaccinationsError;
          setUpcomingVaccinations(vaccinationsData || []);
          
          // Fetch recent journal entries
          const { data: journalData, error: journalError } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('baby_id', profileData.id)
            .order('date', { ascending: false })
            .limit(3);
            
          if (journalError) throw journalError;
          setRecentJournalEntries(journalData || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);
  
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    
    const dob = parseISO(dateOfBirth);
    const now = new Date();
    const months = differenceInMonths(now, dob);
    
    if (months < 1) {
      const weeks = differenceInWeeks(now, dob);
      if (weeks < 1) {
        const days = differenceInDays(now, dob);
        return `${days} day${days !== 1 ? 's' : ''}`;
      }
      return `${weeks} week${weeks !== 1 ? 's' : ''}`;
    } else if (months < 24) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      return remainingMonths > 0 
        ? `${years} year${years !== 1 ? 's' : ''} and ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` 
        : `${years} year${years !== 1 ? 's' : ''}`;
    }
  };
  
  const getMoodEmoji = (mood) => {
    const moods = {
      happy: '😊',
      excited: '🎉',
      tired: '😴',
      sick: '🤒',
      fussy: '😣',
      calm: '😌',
    };
    return moods[mood] || '';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!babyProfile) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400">Welcome to BabyTracker!</h2>
          <p className="text-yellow-700 dark:text-yellow-300 mb-4">
            To get started, please add your baby's profile information.
          </p>
          <Link to="/settings" className="btn-primary inline-flex items-center">
            <FiUser className="mr-2" /> Add Baby Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="card flex flex-col md:flex-row items-center md:items-start">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4 md:mb-0 md:mr-6">
            {babyProfile.avatar_url ? (
              <img 
                src={babyProfile.avatar_url} 
                alt={babyProfile.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <FiUser className="text-gray-400 text-4xl" />
            )}
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-center md:text-left">
              Welcome, {babyProfile.name}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-center md:text-left">
              {babyProfile.date_of_birth && (
                <>Age: {calculateAge(babyProfile.date_of_birth)}</>
              )}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {babyProfile.gender && (
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-3 py-2 rounded-lg text-sm flex items-center">
                  <span className="font-medium mr-1">Gender:</span>
                  <span className="capitalize">{babyProfile.gender}</span>
                </div>
              )}
              
              {babyProfile.weight_at_birth && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-3 py-2 rounded-lg text-sm flex items-center">
                  <span className="font-medium mr-1">Birth Weight:</span>
                  {babyProfile.weight_at_birth} kg
                </div>
              )}
              
              {babyProfile.height_at_birth && (
                <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-3 py-2 rounded-lg text-sm flex items-center">
                  <span className="font-medium mr-1">Birth Length:</span>
                  {babyProfile.height_at_birth} cm
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Growth Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <FiTrendingUp className="mr-2 text-primary-500" /> Growth
            </h2>
            <Link to="/growth" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
              View all
            </Link>
          </div>
          
          {recentGrowthData ? (
            <div>
              <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                Last measured on {format(parseISO(recentGrowthData.date), 'MMMM d, yyyy')}
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Weight</div>
                  <div className="text-lg font-semibold">{recentGrowthData.weight} kg</div>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Height</div>
                  <div className="text-lg font-semibold">{recentGrowthData.height} cm</div>
                </div>
                
                {recentGrowthData.head_circumference && (
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Head</div>
                    <div className="text-lg font-semibold">{recentGrowthData.head_circumference} cm</div>
                  </div>
                )}
              </div>
              
              <div className="mt-4">
                <Link to="/growth" className="btn-primary flex items-center justify-center w-full">
                  <FiPlus className="mr-2" /> Add New Measurement
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No growth data recorded yet</p>
              <Link to="/growth" className="btn-primary flex items-center justify-center">
                <FiPlus className="mr-2" /> Record First Measurement
              </Link>
            </div>
          )}
        </motion.div>
        
        {/* Milestones Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <FiFlag className="mr-2 text-primary-500" /> Recent Milestones
            </h2>
            <Link to="/milestones" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
              View all
            </Link>
          </div>
          
          {recentMilestones.length > 0 ? (
            <div>
              <div className="space-y-3">
                {recentMilestones.map(milestone => (
                  <div key={milestone.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h3 className="font-medium">{milestone.title}</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {format(parseISO(milestone.date), 'MMMM d, yyyy')}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <Link to="/milestones" className="btn-primary flex items-center justify-center w-full">
                  <FiPlus className="mr-2" /> Add New Milestone
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No milestones recorded yet</p>
              <Link to="/milestones" className="btn-primary flex items-center justify-center">
                <FiPlus className="mr-2" /> Record First Milestone
              </Link>
            </div>
          )}
        </motion.div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vaccinations Section */}
        <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold flex items-center">
                        <FiCalendar className="mr-2 text-primary-500" /> Upcoming Vaccinations
                      </h2>
                      <Link to="/vaccinations" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                        View all
                      </Link>
                    </div>
                    
                    {upcomingVaccinations.length > 0 ? (
                      <div>
                        <div className="space-y-3">
                          {upcomingVaccinations.map(vaccination => (
                            <div key={vaccination.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <h3 className="font-medium">{vaccination.name}</h3>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Scheduled: {format(parseISO(vaccination.scheduled_date), 'MMMM d, yyyy')}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4">
                          <Link to="/vaccinations" className="btn-primary flex items-center justify-center w-full">
                            <FiPlus className="mr-2" /> Add Vaccination
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No upcoming vaccinations</p>
                        <Link to="/vaccinations" className="btn-primary flex items-center justify-center">
                          <FiPlus className="mr-2" /> Schedule Vaccination
                        </Link>
                      </div>
                    )}
                  </motion.div>
                  
                  {/* Journal Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="card"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold flex items-center">
                        <FiBook className="mr-2 text-primary-500" /> Recent Journal Entries
                      </h2>
                      <Link to="/journal" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                        View all
                      </Link>
                    </div>
                    
                    {recentJournalEntries.length > 0 ? (
                      <div>
                        <div className="space-y-3">
                          {recentJournalEntries.map(entry => (
                            <div key={entry.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <div className="flex items-center">
                                {entry.mood && (
                                  <span className="text-xl mr-2">{getMoodEmoji(entry.mood)}</span>
                                )}
                                <h3 className="font-medium">{entry.title}</h3>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {format(parseISO(entry.date), 'MMMM d, yyyy')}
                              </div>
                              {entry.content && (
                                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                  {entry.content}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4">
                          <Link to="/journal" className="btn-primary flex items-center justify-center w-full">
                            <FiPlus className="mr-2" /> New Journal Entry
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No journal entries yet</p>
                        <Link to="/journal" className="btn-primary flex items-center justify-center">
                          <FiPlus className="mr-2" /> Create First Entry
                        </Link>
                      </div>
                    )}
                  </motion.div>
                </div>
                
                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8"
                >
                  <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link to="/growth" className="card bg-blue-50 dark:bg-blue-900/20 hover:shadow-md transition-shadow p-4 flex flex-col items-center text-center">
                      <FiTrendingUp className="text-blue-600 dark:text-blue-400 text-2xl mb-2" />
                      <span className="font-medium text-blue-700 dark:text-blue-300">Add Growth Data</span>
                    </Link>
                    
                    <Link to="/milestones" className="card bg-green-50 dark:bg-green-900/20 hover:shadow-md transition-shadow p-4 flex flex-col items-center text-center">
                      <FiFlag className="text-green-600 dark:text-green-400 text-2xl mb-2" />
                      <span className="font-medium text-green-700 dark:text-green-300">Track Milestone</span>
                    </Link>
                    
                    <Link to="/vaccinations" className="card bg-purple-50 dark:bg-purple-900/20 hover:shadow-md transition-shadow p-4 flex flex-col items-center text-center">
                      <FiCalendar className="text-purple-600 dark:text-purple-400 text-2xl mb-2" />
                      <span className="font-medium text-purple-700 dark:text-purple-300">Schedule Vaccine</span>
                    </Link>
                    
                    <Link to="/journal" className="card bg-amber-50 dark:bg-amber-900/20 hover:shadow-md transition-shadow p-4 flex flex-col items-center text-center">
                      <FiBook className="text-amber-600 dark:text-amber-400 text-2xl mb-2" />
                      <span className="font-medium text-amber-700 dark:text-amber-300">Create Journal</span>
                    </Link>
                  </div>
                </motion.div>
              </div>
            );
          };
          
          export default Dashboard;
          