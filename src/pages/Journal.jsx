import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { FiPlus, FiX, FiCalendar, FiTrash2 } from 'react-icons/fi';

const Journal = () => {
  const { user } = useAuth();
  const [babyProfile, setBabyProfile] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingEntry, setAddingEntry] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    content: '',
    mood: 'happy',
  });

  const moods = [
    { id: 'happy', label: 'Happy', emoji: '😊' },
    { id: 'excited', label: 'Excited', emoji: '🎉' },
    { id: 'tired', label: 'Tired', emoji: '😴' },
    { id: 'sick', label: 'Sick', emoji: '🤒' },
    { id: 'fussy', label: 'Fussy', emoji: '😣' },
    { id: 'calm', label: 'Calm', emoji: '😌' },
  ];

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
          // Fetch journal entries
          const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('baby_id', profileData.id)
            .order('date', { ascending: false });
           
          if (error) throw error;
          setEntries(data);
        }
      } catch (error) {
        console.error('Error fetching journal entries:', error);
      } finally {
        setLoading(false);
      }
    };
   
    fetchData();
  }, [user]);
 
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEntry({ ...newEntry, [name]: value });
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);
   
    try {
      if (!babyProfile) throw new Error('Baby profile is required');
     
      const entry = {
        baby_id: babyProfile.id,
        title: newEntry.title.trim(),
        date: newEntry.date,
        content: newEntry.content.trim(),
        mood: newEntry.mood,
      };
     
      const { data, error } = await supabase
        .from('journal_entries')
        .insert(entry)
        .select()
        .single();
       
      if (error) throw error;
     
      // Update UI
      setEntries([data, ...entries]);
     
      // Reset form
      setNewEntry({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        content: '',
        mood: 'happy',
      });
      setAddingEntry(false);
    } catch (error) {
      console.error('Error adding journal entry:', error);
      setErrorMessage(error.message || 'Failed to add journal entry');
    } finally {
      setSubmitting(false);
    }
  };
 
  const deleteEntry = async (id) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id);
       
      if (error) throw error;
     
      // Update UI by removing the deleted entry
      setEntries(entries.filter(entry => entry.id !== id));
    } catch (error) {
      console.error('Error deleting journal entry:', error);
    }
  };
 
  const getMoodEmoji = (moodId) => {
    const mood = moods.find(m => m.id === moodId);
    return mood ? mood.emoji : '';
  };

  return (
    <div className="container mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Baby Journal</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Document special moments, daily activities, and memories
        </p>
      </motion.div>
     
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
        </div>
      ) : !babyProfile ? (
        <div className="card bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400">Add Your Baby's Profile</h2>
          <p className="text-yellow-700 dark:text-yellow-300">Complete your baby's profile to start journaling.</p>
        </div>
      ) : (
        <>
          <div className="card mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Journal Entries</h2>
             
              <button
                onClick={() => setAddingEntry(!addingEntry)}
                className="btn-primary flex items-center"
              >
                {addingEntry ? (
                  <>
                    <FiX className="mr-2" /> Cancel
                  </>
                ) : (
                  <>
                    <FiPlus className="mr-2" /> New Entry
                  </>
                )}
              </button>
            </div>
           
            {addingEntry && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h3 className="text-lg font-semibold mb-4">Add New Journal Entry</h3>
               
                {errorMessage && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{errorMessage}</span>
                  </div>
                )}
               
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                        Title*
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={newEntry.title}
                        onChange={handleInputChange}
                        required
                        placeholder="Title your entry"
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
                        value={newEntry.date}
                        onChange={handleInputChange}
                        required
                        className="input"
                      />
                    </div>
                  </div>
                 
                  <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                      Baby's Mood
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {moods.map(mood => (
                        <label
                          key={mood.id}
                          className={`flex flex-col items-center p-3 rounded-lg cursor-pointer border ${
                            newEntry.mood === mood.id
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="mood"
                            value={mood.id}
                            checked={newEntry.mood === mood.id}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <span className="text-2xl mb-1">{mood.emoji}</span>
                          <span className="text-xs text-gray-700 dark:text-gray-300">{mood.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                 
                  <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                      Content*
                    </label>
                    <textarea
                      name="content"
                      value={newEntry.content}
                      onChange={handleInputChange}
                      required
                      placeholder="Write about your baby's day, milestones, or special moments..."
                      rows="5"
                      className="input"
                    ></textarea>
                  </div>
                 
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setAddingEntry(false)}
                      className="mr-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary"
                    >
                      {submitting ? 'Saving...' : 'Save Entry'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
           
            {!addingEntry && (
              <>
                {entries.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <p>No journal entries yet. Start documenting your baby's journey!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {entries.map(entry => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-300"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              <span className="text-2xl mr-2">{getMoodEmoji(entry.mood)}</span>
                              <h3 className="text-lg font-semibold">{entry.title}</h3>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                              <FiCalendar className="mr-1" />
                              {format(parseISO(entry.date), 'MMMM d, yyyy')}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                            aria-label="Delete entry"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                        
                        <div className="mt-4 whitespace-pre-line">
                          {entry.content}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Journal;
