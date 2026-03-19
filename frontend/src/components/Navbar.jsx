import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { KanbanSquare, Moon, Sun, ChevronDown } from 'lucide-react';
import axios from 'axios';

const Navbar = () => {
  const { user, logout, token } = useContext(AuthContext);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const navigate = useNavigate();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user && token) {
      axios.get('/workspaces').then(res => {
        setWorkspaces(res.data);
        if (res.data.length > 0) setActiveWorkspace(res.data[0]);
      }).catch(console.error);
    } else {
      setWorkspaces([]);
      setActiveWorkspace(null);
    }
  }, [user, token]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleWorkspaceChange = (e) => {
    const ws = workspaces.find(w => w._id === e.target.value);
    setActiveWorkspace(ws);
    // Might want to emit an event or navigate to a dashboard filtered by workspace
    navigate('/');
  };

  return (
    <nav className="bg-surface border-b border-slate-700/50 dark:border-slate-700 px-6 py-3 flex items-center justify-between shadow-md transition-colors">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-800 dark:text-white hover:text-primary transition-colors">
          <KanbanSquare className="text-primary" size={28} />
          <span className="hidden sm:inline">Real-Time Kanban</span>
        </Link>

        {user && workspaces.length > 0 && (
          <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 rounded-md px-3 py-1.5 border border-slate-200 dark:border-slate-600">
            <select
              value={activeWorkspace?._id || ''}
              onChange={handleWorkspaceChange}
              className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 outline-none appearance-none pr-6 cursor-pointer"
            >
              {workspaces.map(w => (
                <option key={w._id} value={w._id} className="dark:bg-slate-800">{w.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 text-slate-500 pointer-events-none" />
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Hello, {user.displayName}</span>
            <button 
              onClick={logout}
              className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-white text-sm py-1.5 px-4 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Link to="/login" className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-white transition-colors text-sm py-1.5 px-3">Login</Link>
            <Link to="/register" className="bg-primary hover:bg-blue-600 text-white text-sm py-1.5 px-4 rounded-md transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
