import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { FiSave, FiUser, FiCamera, FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';

const Settings = () => {
  const { user, signOut } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme(); // Use the correct property names
  const [babyProfile, setBabyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    date_of_birth: '',
    gender: 'other',
    weight_at_birth: '',
    height_at_birth: '',
    avatar_url: null,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Fetch baby profile
        const { data, error } = await supabase
          .from('baby_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          setBabyProfile(data);
          setFormData({
            name: data.name || '',
            date_of_birth: data.date_of_birth || '',
            gender: data.gender || 'other',
            weight_at_birth: data.weight_at_birth || '',
            height_at_birth: data.height_at_birth || '',
            avatar_url: data.avatar_url || null,
          });
          setAvatarPreview(data.avatar_url);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Preview image
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    setUploadingAvatar(true);
    
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = fileName; // Remove the 'kidavu/' prefix
      
      // In your handleAvatarChange function
const { error: uploadError } = await supabase.storage
.from('kidavu')
.upload(filePath, file, {
  cacheControl: '3600',
  upsert: true,
  contentType: file.type,
  // Add access level if available in your Supabase version
  access: 'public' // This option might be available in newer versions
});

      
      // Get public URL
      const { data } = supabase.storage
        .from('kidavu')
        .getPublicUrl(filePath);
        
      setFormData({ ...formData, avatar_url: data.publicUrl });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setErrorMessage('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      const profileData = {
        name: formData.name.trim(),
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        weight_at_birth: formData.weight_at_birth || null,
        height_at_birth: formData.height_at_birth || null,
        avatar_url: formData.avatar_url,
      };
      
      if (babyProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('baby_profiles')
          .update(profileData)
          .eq('id', babyProfile.id);
          
        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from('baby_profiles')
          .insert({
            ...profileData,
            user_id: user.id,
          });
          
        if (error) throw error;
      }
      
      setSuccessMessage('Profile saved successfully!');
      
      // Refresh profile data
      const { data } = await supabase
        .from('baby_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      setBabyProfile(data);
      
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrorMessage('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
      
      // Clear success message after 3 seconds
      if (successMessage) {
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    }
  };
  
  // Use toggleDarkMode directly instead of creating a custom toggleTheme function
  
  return (
    <div className="container mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your baby's profile and app preferences
        </p>
      </motion.div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiUser className="mr-2" /> Baby Profile
            </h2>
            
            {successMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{successMessage}</span>
              </div>
            )}
            
            {errorMessage && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{errorMessage}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6 flex flex-col items-center md:items-start md:flex-row">
                <div className="w-32 h-32 relative mb-4 md:mb-0 md:mr-6">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Baby avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FiUser className="text-gray-400 text-4xl" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-primary-500 text-white rounded-full p-2 cursor-pointer shadow-lg">
                    <FiCamera className="text-lg" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={uploadingAvatar}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <div className="flex-1 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                        Baby's Name*
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter baby's name"
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                        Date of Birth*
                      </label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleInputChange}
                        required
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="input"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                        Birth Weight (kg)
                      </label>
                      <input
                        type="number"
                        name="weight_at_birth"
                        value={formData.weight_at_birth}
                        onChange={handleInputChange}
                        step="0.01"
                        placeholder="e.g., 3.5"
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                        Birth Length (cm)
                      </label>
                      <input
                        type="number"
                        name="height_at_birth"
                        value={formData.height_at_birth}
                        onChange={handleInputChange}
                        step="0.1"
                        placeholder="e.g., 50.5"
                        className="input"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving || uploadingAvatar}
                  className="btn-primary flex items-center"
                >
                  <FiSave className="mr-2" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
          
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">App Preferences</h2>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Dark Mode</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Switch between light and dark themes
                </p>
              </div>
              
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors shadow-sm flex items-center justify-center"
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? (
                  <FiSun className="text-yellow-500 text-xl" />
                ) : (
                  <FiMoon className="text-gray-700 text-xl" />
                )}
              </button>
            </div>
          </div>
          
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Account</h2>
            
            <div>
              <h3 className="font-medium">Logged in as</h3>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={signOut}
                className="btn-secondary"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Settings;
