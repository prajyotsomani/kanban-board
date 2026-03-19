import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!displayName) newErrors.displayName = 'Display Name is required';
    else if (displayName.length < 3) newErrors.displayName = 'Must be at least 3 characters';
    
    if (!email) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Email is invalid';
    
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Must be at least 6 characters';
    
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    try {
      await register(displayName, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="bg-surface p-8 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md backdrop-blur-sm bg-opacity-95">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-white">Create Account</h2>
        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-6 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1.5">Display Name</label>
            <input 
              type="text" 
              className={`w-full bg-slate-800 border ${fieldErrors.displayName ? 'border-red-500' : 'border-slate-600'} rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-500`} 
              placeholder="John Doe"
              value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            />
            {fieldErrors.displayName && <p className="text-red-500 text-xs mt-1">{fieldErrors.displayName}</p>}
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1.5">Email</label>
            <input 
              type="email" 
              className={`w-full bg-slate-800 border ${fieldErrors.email ? 'border-red-500' : 'border-slate-600'} rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-500`} 
              placeholder="you@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
             {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1.5">Password</label>
            <input 
              type="password" 
              className={`w-full bg-slate-800 border ${fieldErrors.password ? 'border-red-500' : 'border-slate-600'} rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder-slate-500`} 
              placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
             {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
          </div>
          <button type="submit" className="mt-2 bg-primary hover:bg-blue-600 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-200 uppercase tracking-wider text-sm">
            Sign Up
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account? <Link to="/login" className="text-primary hover:underline hover:text-blue-400">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
