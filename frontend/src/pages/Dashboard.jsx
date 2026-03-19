import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus, LayoutTemplate } from 'lucide-react';

const Dashboard = () => {
  const [boards, setBoards] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const res = await axios.get('/boards');
      setBoards(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createBoard = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await axios.post('/boards', { title: newTitle });
      setBoards([...boards, res.data]);
      setNewTitle('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating board');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-10 flex border-b border-slate-700 pb-6 items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <LayoutTemplate className="text-primary" /> 
            Your Boards
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Select a board to start collaborating or create a new one.</p>
        </div>
        
        <form onSubmit={createBoard} className="flex gap-2">
          <input
            type="text"
            placeholder="New board title..."
            className="bg-slate-800 border border-slate-600 rounded px-4 outline-none focus:border-primary text-white text-sm"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button type="submit" className="bg-primary hover:bg-blue-600 text-white p-2 rounded flex items-center gap-2 transition-colors text-sm font-medium">
            <Plus size={18} /> Create
          </button>
        </form>
      </div>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {boards.map(board => (
          <Link 
            key={board._id} 
            to={`/board/${board._id}`}
            className="bg-surface hover:bg-slate-700 border border-slate-700 hover:border-primary transform hover:-translate-y-1 transition-all duration-200 rounded-xl p-6 shadow-lg group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-10 bg-gradient-to-tr from-transparent to-primary rounded-bl-full"></div>
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-primary transition-colors">{board.title}</h3>
            <p className="text-slate-400 text-sm">Click to open board &rarr;</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
