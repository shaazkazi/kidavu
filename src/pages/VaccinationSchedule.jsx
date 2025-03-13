import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO, isPast, addDays, addMonths } from 'date-fns';
import { FiCheck, FiPlus, FiCalendar, FiClock, FiX } from 'react-icons/fi';

const VaccinationSchedule = () => {
  const { user } = useAuth();
  const [babyProfile, setBabyProfile] = useState(null);
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [addingVaccination, setAddingVaccination] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newVaccination, setNewVaccination] = useState({
    name: '',
    scheduled_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    const fetchData = async () => {
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
          // Fetch vaccinations
          const { data, error } = await supabase
            .from('vaccinations')
            .select('*')
            .eq('baby_id', profileData.id)
            .order('scheduled_date', { ascending: true });
            
          if (error) throw error;
          setVaccinations(data);
          
          // If no vaccinations yet, suggest standard ones
          if (data.length === 0 && profileData.date_of_birth) {
            suggestStandardVaccinations(profileData.date_of_birth);
          }
        }
      } catch (error) {
        console.error('Error fetching vaccinations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  const suggestStandardVaccinations = (dateOfBirth) => {
    const dob = parseISO(dateOfBirth);
    const standardVaccinations = [
      {
        name: 'Hepatitis B (HepB)',
        scheduled_date: format(dob, 'yyyy-MM-dd'),
        administered_date: null,
        notes: 'First dose at birth',
      },
      {
        name: 'Hepatitis B (HepB)',
        scheduled_date: format(addMonths(dob, 1), 'yyyy-MM-dd'),
        administered_date: null,
        notes: 'Second dose',
      },
      {
        name: 'DTaP (Diphtheria, Tetanus, Pertussis)',
        scheduled_date: format(addMonths(dob, 2), 'yyyy-MM-dd'),
        administered_date: null,
        notes: 'First dose',
      },
      {
        name: 'IPV (Polio)',
        scheduled_date: format(addMonths(dob, 2), 'yyyy-MM-dd'),
        administered_date: null,
        notes: 'First dose',
      },
      {
        name: 'Hib (Haemophilus influenzae type b)',
        scheduled_date: format(addMonths(dob, 2), 'yyyy-MM-dd'),
        administered_date: null,
        notes: 'First dose',
      },
      {
        name: 'PCV13 (Pneumococcal)',
        scheduled_date: format(addMonths(dob, 2), 'yyyy-MM-dd'),
        administered_date: null,
        notes: 'First dose',
      },
      {
        name: 'RV (Rotavirus)',
        scheduled_date: format(addMonths(dob, 2), 'yyyy-MM-dd'),
        administered_date: null,
        notes: 'First dose',
      },
      {
        name: 'DTaP (Diphtheria, Tetanus, Pertussis)',
        scheduled_date: format(addMonths(dob, 4), 'yyyy-MM-dd'),
        administered_date: null,
        notes: 'Second dose',
      },
      {
        name: 'IPV (Polio)',
        scheduled_date: format(addMonths(dob, 4), 'yyyy-MM-dd'),
        administered_date: null,
        notes: 'Second dose',
      },
      {
        name: 'Hib (Haemophilus influenzae type b)',
        scheduled_date: format(addMonths(dob, 4), 'yyyy-MM-dd'),
        administered_date: null,
        notes: 'Second dose',
      },
      {
        name: 'PCV13 (Pneumococcal)',
        scheduled_date: format(addMonths(dob, 4), 'yyyy-MM-dd'),
        administered_date: null,
        notes: 'Second dose',
      },
      {
        name: 'RV (Rotavirus)',
        scheduled_date: format(addMonths(dob, 4), 'yyyy-MM-dd'),
        administered_date: null,
        notes: 'Second dose',
      },
    ];
    
    const addVaccinations = async () => {
      try {
        // Add all suggested vaccinations to the database
        for (const vacc of standardVaccinations) {
          await supabase
            .from('vaccinations')
            .insert({
              ...vacc,
              baby_id: babyProfile.id,
            });
        }
        
        // Fetch the updated list
        const { data, error } = await supabase
        .from('vaccinations')
        .select('*')
        .eq('baby_id', babyProfile.id)
        .order('scheduled_date', { ascending: true });
        
      if (error) throw error;
      setVaccinations(data);
    } catch (error) {
      console.error('Error suggesting vaccinations:', error);
    }
  };
  
  if (babyProfile) {
    addVaccinations();
  }
};

const handleInputChange = (e) => {
  const { name, value } = e.target;
  setNewVaccination({ ...newVaccination, [name]: value });
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setErrorMessage('');
  setSubmitting(true);
  
  try {
    if (!babyProfile) throw new Error('Baby profile is required');
    
    const vaccination = {
      baby_id: babyProfile.id,
      name: newVaccination.name.trim(),
      scheduled_date: newVaccination.scheduled_date,
      notes: newVaccination.notes.trim() || null,
      administered_date: null,
    };
    
    const { data, error } = await supabase
      .from('vaccinations')
      .insert(vaccination)
      .select()
      .single();
      
    if (error) throw error;
    
    // Update UI
    setVaccinations([...vaccinations, data]);
    
    // Reset form
    setNewVaccination({
      name: '',
      scheduled_date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    });
    setAddingVaccination(false);
  } catch (error) {
    console.error('Error adding vaccination:', error);
    setErrorMessage(error.message || 'Failed to add vaccination');
  } finally {
    setSubmitting(false);
  }
};

const markAsAdministered = async (id) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('vaccinations')
      .update({ administered_date: today })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    // Update the vaccination in the local state
    const updatedVaccinations = vaccinations.map(v => 
      v.id === id ? data : v
    );
    
    setVaccinations(updatedVaccinations);
  } catch (error) {
    console.error('Error marking vaccination as administered:', error);
  }
};

const upcomingVaccinations = vaccinations.filter(v => !v.administered_date);
const completedVaccinations = vaccinations.filter(v => v.administered_date);

return (
  <div className="container mx-auto">
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Vaccination Schedule</h1>
      <p className="text-gray-600 dark:text-gray-300">
        Keep track of your baby's vaccinations and upcoming appointments
      </p>
    </motion.div>
    
    {loading ? (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    ) : !babyProfile ? (
      <div className="card bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
        <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400">Add Your Baby's Profile</h2>
        <p className="text-yellow-700 dark:text-yellow-300">Complete your baby's profile to track vaccinations.</p>
      </div>
    ) : (
      <>
        <div className="card mb-6">
          <div className="flex flex-wrap justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Vaccinations</h2>
            
            <button
              onClick={() => setAddingVaccination(!addingVaccination)}
              className="btn-primary flex items-center"
            >
              {addingVaccination ? (
                <>
                  <FiX className="mr-2" /> Cancel
                </>
              ) : (
                <>
                  <FiPlus className="mr-2" /> Add Vaccination
                </>
              )}
            </button>
          </div>
          
          {addingVaccination ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-semibold mb-4">Add New Vaccination</h3>
              
              {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                  <span className="block sm:inline">{errorMessage}</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                      Vaccine Name*
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newVaccination.name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., DTaP, MMR, Hepatitis B"
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                      Scheduled Date*
                    </label>
                    <input
                      type="date"
                      name="scheduled_date"
                      value={newVaccination.scheduled_date}
                      onChange={handleInputChange}
                      required
                      className="input"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={newVaccination.notes}
                    onChange={handleInputChange}
                    placeholder="Additional information about this vaccine..."
                    rows="3"
                    className="input"
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setAddingVaccination(false)}
                    className="mr-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                  >
                    {submitting ? 'Saving...' : 'Save Vaccination'}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <>
              <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6">
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`pb-3 font-medium text-sm flex items-center ${
                      activeTab === 'upcoming'
                        ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <FiClock className="mr-2" /> Upcoming
                    {upcomingVaccinations.length > 0 && (
                      <span className="ml-2 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-300 px-2 py-0.5 rounded-full text-xs">
                        {upcomingVaccinations.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('completed')}
                    className={`pb-3 font-medium text-sm flex items-center ${
                      activeTab === 'completed'
                        ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <FiCheck className="mr-2" /> Completed
                    {completedVaccinations.length > 0 && (
                      <span className="ml-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-0.5 rounded-full text-xs">
                        {completedVaccinations.length}
                      </span>
                    )}
                  </button>
                </nav>
              </div>
              
              {activeTab === 'upcoming' && (
                <>
                  {upcomingVaccinations.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                      <p>No upcoming vaccinations. Add your first vaccine to track!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {upcomingVaccinations.map(vaccination => (
                        <div 
                          key={vaccination.id} 
                          className="py-4 flex flex-wrap md:flex-nowrap justify-between items-center"
                        >
                          <div className="flex-grow">
                            <h3 className="text-lg font-semibold">{vaccination.name}</h3>
                            <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
                              <FiCalendar className="mr-1" />
                              {format(parseISO(vaccination.scheduled_date), 'MMMM d, yyyy')}
                              {isPast(parseISO(vaccination.scheduled_date)) && (
                                <span className="ml-2 text-red-600 dark:text-red-400">
                                  Overdue
                                </span>
                              )}
                            </div>
                            {vaccination.notes && (
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                {vaccination.notes}
                              </p>
                            )}
                          </div>
                          
                          <button
                            onClick={() => markAsAdministered(vaccination.id)}
                            className="mt-3 md:mt-0 btn-success"
                          >
                            <FiCheck className="mr-2" /> Mark Complete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              
              {activeTab === 'completed' && (
                <>
                  {completedVaccinations.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                      <p>No completed vaccinations yet.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {completedVaccinations.map(vaccination => (
                        <div 
                          key={vaccination.id} 
                          className="py-4"
                        >
                          <div className="flex items-center">
                            <div className="rounded-full bg-green-100 dark:bg-green-900 p-2 mr-3">
                              <FiCheck className="text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold">{vaccination.name}</h3>
                          </div>
                          <div className="ml-9">
                            <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
                              <span className="mr-4">
                                <span className="font-medium">Scheduled:</span> {format(parseISO(vaccination.scheduled_date), 'MMM d, yyyy')}
                              </span>
                              <span>
                                <span className="font-medium">Completed:</span> {format(parseISO(vaccination.administered_date), 'MMM d, yyyy')}
                              </span>
                            </div>
                            {vaccination.notes && (
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                {vaccination.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </>
    )}
  </div>
);
};

export default VaccinationSchedule;
