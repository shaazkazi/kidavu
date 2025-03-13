import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { FiUser, FiLock, FiMail, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  
  const { signIn, signUp, resendEmailVerification } = useAuth(); // Add resendEmailVerification
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isSignUp) {
        await signUp(email, password);
        setVerificationSent(true);
        setIsSignUp(false);
      } else {
        await signIn(email, password);
        navigate('/');
      }
    } catch (err) {
      // Check if the error is about email verification
      if (err.message?.includes('not confirmed') || 
          err.message?.includes('email verification')) {
        setError('Please verify your email before signing in');
        setVerificationSent(true);
      } else {
        setError(err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setResendLoading(true);
    try {
      await resendEmailVerification(email);
      setError('');
      setVerificationSent(true);
    } catch (err) {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">Kidavu</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Baby Development Tracker</p>
        </div>
        
        <div className="mb-8">
          <img
            src="https://img.freepik.com/free-vector/hand-drawn-baby-shower-background_23-2149047354.jpg"
            alt="Baby illustration"
            className="w-full h-32 object-contain"
          />
        </div>
        
        {/* Email Verification Notice */}
        {verificationSent && (
          <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-4" role="alert">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Email Verification Required</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>A verification link has been sent to <strong>{email}</strong>.</p>
                  <p className="mt-1">Please check your email and click the link to verify your account before signing in.</p>
                  <p className="mt-1">Don't see it? Check your spam folder or try resending the verification email.</p>
                  <button 
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {resendLoading ? (
                      <>
                        <FiRefreshCw className="animate-spin -ml-0.5 mr-2 h-4 w-4" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <FiRefreshCw className="-ml-0.5 mr-2 h-4 w-4" />
                        Resend verification email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {error && !verificationSent && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex justify-center items-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              isSignUp ? 'Sign Up' : 'Sign In'
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setVerificationSent(false);
              setError('');
            }}
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
