import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const GrowthTracker = () => {
  const { user } = useAuth();
  const [growthData, setGrowthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [babyProfile, setBabyProfile] = useState(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    weight: '',
    height: '',
    head_circumference: '',
    notes: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [addingRecord, setAddingRecord] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch baby profile
        const { data: profileData, error: profileError } = await supabase
          .from('baby_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (profileError) throw profileError;
        setBabyProfile(profileData);
        
        // Fetch growth records
        const { data, error } = await supabase
          .from('growth_records')
          .select('*')
          .eq('baby_id', profileData.id)
          .order('date', { ascending: true });
          
        if (error) throw error;
        setGrowthData(data);
      } catch (error) {
        console.error('Error fetching growth data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);
    
    try {
      // Convert string inputs to numbers
      const record = {
        baby_id: babyProfile.id,
        date: formData.date,
        weight: parseFloat(formData.weight) || null,
        height: parseFloat(formData.height) || null,
        head_circumference: parseFloat(formData.head_circumference) || null,
        notes: formData.notes.trim() || null,
      };
      
      const { data, error } = await supabase
        .from('growth_records')
        .insert(record)
        .select()
        .single();
        
      if (error) throw error;
      
      // Update the UI with the new record
      setGrowthData([...growthData, data]);
      
      // Update baby profile with latest measurements
      await supabase
        .from('baby_profiles')
        .update({
          current_weight: record.weight,
          current_height: record.height,
        })
        .eq('id', babyProfile.id);
      
      // Reset form
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        weight: '',
        height: '',
        head_circumference: '',
        notes: '',
      });
      setAddingRecord(false);
    } catch (error) {
      console.error('Error adding growth record:', error);
      setErrorMessage(error.message || 'Failed to add record');
    } finally {
      setSubmitting(false);
    }
  };
  
  const formatChartData = () => {
    return growthData.map(record => ({
      date: format(new Date(record.date), 'MM/dd/yy'),
      weight: record.weight,
      height: record.height,
      head_circumference: record.head_circumference,
    }));
  };

  return (
    <div className="container mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Growth Tracker</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Record and visualize your baby's growth over time
        </p>
      </motion.div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
        </div>
      ) : !babyProfile ? (
        <div className="card bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400">Add Your Baby's Profile</h2>
          <p className="text-yellow-700 dark:text-yellow-300">Complete your baby's profile to track growth.</p>
        </div>
      ) : (
        <>
          <div className="card mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Growth Chart</h2>
              <button
                onClick={() => setAddingRecord(!addingRecord)}
                className="btn-primary"
              >
                {addingRecord ? 'Cancel' : 'Add New Record'}
              </button>
            </div>
            
            {growthData.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No growth records yet. Add your first record to see the chart.</p>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formatChartData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" />
                    <XAxis dataKey="date" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      name="Weight (kg)"
                      stroke="#3b82f6"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="height"
                      name="Height (cm)"
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="head_circumference"
                      name="Head (cm)"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          
          {addingRecord && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card mb-6"
            >
              <h3 className="text-lg font-semibold mb-4">Add Growth Record</h3>
              
              {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                  <span className="block sm:inline">{errorMessage}</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      step="0.01"
                      placeholder="e.g., 5.2"
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleInputChange}
                      step="0.1"
                      placeholder="e.g., 60.5"
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                      Head Circumference (cm)
                    </label>
                    <input
                      type="number"
                      name="head_circumference"
                      value={formData.head_circumference}
                      onChange={handleInputChange}
                      step="0.1"
                      placeholder="e.g., 40.2"
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
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Add any notes about this measurement..."
                    rows="3"
                    className="input"
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setAddingRecord(false)}
                    className="mr-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                  >
                    {submitting ? 'Saving...' : 'Save Record'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
          
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Growth History</h3>
            
            {growthData.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No records yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Weight (kg)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Height (cm)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Head (cm)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {growthData.slice().reverse().map((record) => (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {format(new Date(record.date), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {record.weight || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {record.height || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {record.head_circumference || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">
                          {record.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GrowthTracker;
