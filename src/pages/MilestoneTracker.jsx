import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { FiPlus, FiX } from 'react-icons/fi'; // Removed FiCamera and FiCheck

const MilestoneTracker = () => {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState([]);
  const [babyProfile, setBabyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category: 'motor',
    description: '', // Changed from notes to description
  });

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
          // Fetch milestones
          const { data, error } = await supabase
            .from('milestones')
            .select('*')
            .eq('baby_id', profileData.id)
            .order('date', { ascending: false });
           
          if (error) throw error;
          setMilestones(data);
        }
       
        // Fetch milestone categories
        setCategories([
          { id: 'motor', name: 'Motor Skills' },
          { id: 'cognitive', name: 'Cognitive' },
          { id: 'social', name: 'Social & Emotional' },
          { id: 'language', name: 'Language' },
          { id: 'other', name: 'Other' },
        ]);
      } catch (error) {
        console.error('Error fetching milestones:', error);
      } finally {
        setLoading(false);
      }
    };
   
    fetchData();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMilestone({ ...newMilestone, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);
   
    try {
      if (!babyProfile) throw new Error('Baby profile is required');
     
      const milestone = {
        baby_id: babyProfile.id,
        title: newMilestone.title.trim(),
        date: newMilestone.date,
        category: newMilestone.category,
        description: newMilestone.description.trim() || null, // Changed from notes to description
      };
     
      const { data, error } = await supabase
        .from('milestones')
        .insert(milestone)
        .select()
        .single();
       
      if (error) throw error;
     
      // Update UI
      setMilestones([data, ...milestones]);
     
      // Reset form
      setNewMilestone({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        category: 'motor',
        description: '', // Changed from notes to description
      });
      
      setIsAddingMilestone(false);
    } catch (error) {
      console.error('Error adding milestone:', error);
      setErrorMessage(error.message || 'Failed to add milestone');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMilestones = selectedCategory === 'all'
    ? milestones
    : milestones.filter(m => m.category === selectedCategory);

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  return (
    <div className="container mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Milestone Tracker</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Capture and celebrate your baby's special moments and achievements
        </p>
      </motion.div>
     
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : !babyProfile ? (
        <div className="card bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400">Add Your Baby's Profile</h2>
          <p className="text-yellow-700 dark:text-yellow-300">Complete your baby's profile to track milestones.</p>
        </div>
      ) : (
        <>
          <div className="card mb-6">
            <div className="flex flex-wrap justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Baby Milestones</h2>
             
              <button
                onClick={() => setIsAddingMilestone(!isAddingMilestone)}
                className="btn-primary flex items-center"
              >
                {isAddingMilestone ? (
                  <>
                    <FiX className="mr-2" /> Cancel
                  </>
                ) : (
                  <>
                    <FiPlus className="mr-2" /> Add Milestone
                  </>
                )}
              </button>
            </div>
           
            {!isAddingMilestone && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedCategory === 'all'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    All
                  </button>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedCategory === category.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
           
            {isAddingMilestone && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-lg font-semibold mb-4">Add New Milestone</h3>
               
                {errorMessage && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{errorMessage}</span>
                  </div>
                )}
               
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                        Milestone Title*
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={newMilestone.title}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., First Smile, First Steps"
                        className="input"
                      />
                    </div>
                   
                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                        Date*
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={newMilestone.date}
                        onChange={handleInputChange}
                        required
                        className="input"
                      />
                    </div>
                   
                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                        Category
                      </label>
                      <select
                        name="category"
                        value={newMilestone.category}
                        onChange={handleInputChange}
                        className="input"
                      >
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                 
                  <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={newMilestone.description}
                      onChange={handleInputChange}
                      placeholder="Add details about this milestone..."
                      rows="3"
                      className="input"
                    ></textarea>
                  </div>
                 
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsAddingMilestone(false)}
                      className="mr-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary"
                    >
                      {submitting ? 'Saving...' : 'Save Milestone'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>
         
          {!isAddingMilestone && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMilestones.length === 0 ? (
                <div className="col-span-full text-center py-10 text-gray-500 dark:text-gray-400">
                  {selectedCategory === 'all' ? (
                    <p>No milestones recorded yet. Add your first milestone!</p>
                  ) : (
                    <p>No milestones in this category yet.</p>
                  )}
                </div>
              ) : (
                filteredMilestones.map(milestone => (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card hover:shadow-lg transition-all duration-300"
                  >
                    <h3 className="text-lg font-semibold">{milestone.title}</h3>
                   
                    <div className="flex items-center justify-between mt-2 mb-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(milestone.date), 'MMM d, yyyy')}
                      </span>
                      <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full">
                        {getCategoryName(milestone.category)}
                      </span>
                    </div>
                   
                    {milestone.description && (
                      <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">
                        {milestone.description}
                      </p>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MilestoneTracker;
