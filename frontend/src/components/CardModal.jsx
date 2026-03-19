import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Calendar, Tags, Users } from 'lucide-react';
import axios from 'axios';

const CardModal = ({ card, onClose, onUpdate }) => {
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [desc, setDesc] = useState(card.description || '');

  const saveDescription = async () => {
    try {
      await axios.patch(`/cards/${card._id}`, { description: desc, clientVersion: card.version });
      onUpdate({ ...card, description: desc, version: card.version + 1 });
      setIsEditingDesc(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-surface w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{card.title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 custom-scrollbar">
          
          <div className="flex gap-4 flex-wrap text-sm">
            {card.dueDate && (
              <div className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-full font-medium border border-blue-200 dark:border-blue-800">
                <Calendar size={16} /> {new Date(card.dueDate).toLocaleDateString()}
              </div>
            )}
            {card.labels && card.labels.length > 0 && (
              <div className="flex items-center gap-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-full font-medium border border-purple-200 dark:border-purple-800">
                <Tags size={16} /> {card.labels.join(', ')}
              </div>
            )}
            {card.assignees && card.assignees.length > 0 && (
              <div className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full font-medium border border-green-200 dark:border-green-800">
                <Users size={16} /> {card.assignees.length} Assignees
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Description</h3>
            {isEditingDesc ? (
              <div className="flex flex-col gap-3">
                <textarea
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-3 min-h-[150px] outline-none focus:ring-2 focus:ring-primary text-slate-800 dark:text-slate-200"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Add a more detailed description..."
                />
                <div className="flex gap-2">
                  <button onClick={saveDescription} className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Save</button>
                  <button onClick={() => { setDesc(card.description || ''); setIsEditingDesc(false); }} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-md text-sm font-medium transition-colors">Cancel</button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => setIsEditingDesc(true)}
                className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-4 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors min-h-[100px]"
              >
                {card.description ? <ReactMarkdown>{card.description}</ReactMarkdown> : <span className="text-slate-400 italic">Click to add a description...</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardModal;
