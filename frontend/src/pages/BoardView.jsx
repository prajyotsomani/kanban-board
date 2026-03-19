import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { SocketContext } from '../contexts/SocketContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'react-toastify';
import { Plus, GripVertical, AlertTriangle, Search, X, Undo2, Edit2, Trash2 } from 'lucide-react';
import CardModal from '../components/CardModal';

const BoardView = () => {
  const { id } = useParams();
  const { socket } = useContext(SocketContext);
  
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState({});
  const [columnOrder, setColumnOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeUsers, setActiveUsers] = useState({}); // { userId: { displayName, cardId } }
  const [moveHistory, setMoveHistory] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const res = await axios.get(`/boards/${id}`);
        const { board, columns: cols, cards } = res.data;
        
        setBoard(board);
        
        const columnMap = {};
        cols.forEach(c => {
          columnMap[c._id] = {
            ...c,
            cards: cards.filter(card => card.columnId === c._id).sort((a,b) => a.position - b.position)
          };
        });
        
        setColumns(columnMap);
        setColumnOrder(board.columnOrder?.length ? board.columnOrder : cols.map(c => c._id).sort((a,b) => cols.find(c=>c._id===a).position - cols.find(c=>c._id===b).position));
        setLoading(false);
      } catch (err) {
        toast.error("Failed to load board");
        setLoading(false);
      }
    };
    fetchBoard();
  }, [id]);

  useEffect(() => {
    if (!socket || loading) return;
    
    const token = localStorage.getItem('token');
    socket.emit('board:join', { token, boardId: id });

    // Handle board:state via initial fetch is faster, but we should listen to websocket updates
    const handleCardMoved = (data) => {
      setColumns((prevCols) => {
        const newCols = { ...prevCols };
        const sourceCol = newCols[data.fromColumnId];
        const destCol = newCols[data.toColumnId];
        
        let cardToMove = null;
        if (sourceCol) {
          const cardIdx = sourceCol.cards.findIndex(c => c._id === data.cardId);
          if (cardIdx > -1) {
            cardToMove = sourceCol.cards[cardIdx];
            sourceCol.cards.splice(cardIdx, 1);
          }
        }
        
        if (cardToMove && destCol) {
          cardToMove.version = data.newVersion;
          cardToMove.columnId = data.toColumnId;
          cardToMove.position = data.newPosition;
          destCol.cards.splice(data.newPosition, 0, cardToMove);
        }
        return newCols;
      });
    };

    const handleCardUpdated = (data) => {
      setColumns((prevCols) => {
        const newCols = { ...prevCols };
        for (let colId in newCols) {
          const card = newCols[colId].cards.find(c => c._id === data.cardId);
          if (card) {
            Object.assign(card, data.patch);
            card.version = data.newVersion;
            break;
          }
        }
        return newCols;
      });
    };

    const handleCardCreated = (card) => {
      setColumns((prevCols) => {
        const newCols = { ...prevCols };
        if (newCols[card.columnId]) {
          newCols[card.columnId].cards.push(card);
        }
        return newCols;
      });
    };
    
    const handleCardDeleted = (data) => {
      setColumns((prevCols) => {
        const newCols = { ...prevCols };
        for (let colId in newCols) {
          newCols[colId].cards = newCols[colId].cards.filter(c => c._id !== data.cardId);
        }
        return newCols;
      });
    };

    const handlePresence = (data) => {
      setActiveUsers(prev => {
        const next = {...prev};
        if (data.cardId === null) {
          // just board presence, could map to a user object if backend sent more
           next[data.userId.id || data.userId] = { ...next[data.userId.id || data.userId], cardId: null, userId: data.userId };
        } else {
           next[data.userId.id || data.userId] = { ...next[data.userId.id || data.userId], cardId: data.cardId, userId: data.userId };
        }
        return next;
      });
    };

    const handleCardRejected = (data) => {
      toast.error(`Sync conflict! Restoring card state.`, { icon: <AlertTriangle /> });
      setMoveHistory([]); // clear undo history on conflict
      // In a real app we'd reconcile currentState, here we reload for absolute safety
      setTimeout(() => window.location.reload(), 1500);
    };

    socket.on('card:moved', handleCardMoved);
    socket.on('card:updated', handleCardUpdated);
    socket.on('card:created', handleCardCreated);
    socket.on('card:deleted', handleCardDeleted);
    socket.on('presence:update', handlePresence);
    socket.on('card:rejected', handleCardRejected);

    return () => {
      socket.off('card:moved', handleCardMoved);
      socket.off('card:updated', handleCardUpdated);
      socket.off('card:created', handleCardCreated);
      socket.off('presence:update', handlePresence);
      socket.off('card:rejected', handleCardRejected);
    };
  }, [socket, id, loading]);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const startCol = columns[source.droppableId];
    const draggedCard = startCol.cards.find(c => c._id === draggableId);
    if (!draggedCard) return;

    // Optimistic UI Update
    setColumns((prevCols) => {
      const newCols = { ...prevCols };
      const newStartCards = Array.from(newCols[source.droppableId].cards);
      newStartCards.splice(source.index, 1);
      
      if (source.droppableId === destination.droppableId) {
        newStartCards.splice(destination.index, 0, draggedCard);
        newCols[source.droppableId].cards = newStartCards;
      } else {
        const newEndCards = Array.from(newCols[destination.droppableId].cards);
        newEndCards.splice(destination.index, 0, draggedCard);
        newCols[source.droppableId].cards = newStartCards;
        newCols[destination.droppableId].cards = newEndCards;
      }
      return newCols;
    });

    // Record History for Undo
    setMoveHistory(prev => [...prev, {
      cardId: draggableId,
      fromColumnId: destination.droppableId, // inverse
      toColumnId: source.droppableId,
      newPosition: source.index,
      oldPosition: destination.index,
      clientVersion: draggedCard.version + 1
    }]);

    socket.emit('card:move', {
      cardId: draggableId,
      fromColumnId: source.droppableId,
      toColumnId: destination.droppableId,
      newPosition: destination.index,
      clientVersion: draggedCard.version
    });
    
    // Increment local version to match expected future version
    draggedCard.version += 1;
    draggedCard.columnId = destination.droppableId;
    draggedCard.position = destination.index;
  };

  const handleUndo = useCallback(() => {
    if (moveHistory.length === 0) return;
    const lastMove = moveHistory[moveHistory.length - 1];
    setMoveHistory(prev => prev.slice(0, -1));

    // We do an optimistic rollback exactly like normal move but without recording
    const destColId = lastMove.toColumnId;
    const sourceColId = lastMove.fromColumnId;

    let targetCard = null;
    let currentVersion = 0;

    setColumns((prevCols) => {
      const newCols = { ...prevCols };
      const startCol = newCols[sourceColId];
      const destCol = newCols[destColId];
      
      const cardIdx = startCol.cards.findIndex(c => c._id === lastMove.cardId);
      if (cardIdx > -1) {
        targetCard = startCol.cards[cardIdx];
        currentVersion = targetCard.version;
        startCol.cards.splice(cardIdx, 1);
        destCol.cards.splice(lastMove.newPosition, 0, targetCard);
      }
      return newCols;
    });

    if (targetCard) {
      socket.emit('card:move', {
        cardId: lastMove.cardId,
        fromColumnId: sourceColId,
        toColumnId: destColId,
        newPosition: lastMove.newPosition,
        clientVersion: currentVersion
      });
      targetCard.version += 1;
      targetCard.columnId = destColId;
      targetCard.position = lastMove.newPosition;
    }
  }, [moveHistory, socket]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  const handleAddCard = async (colId) => {
    const title = prompt('Enter card title:');
    if (!title) return;
    try {
      const position = columns[colId].cards.length;
      await axios.post(`/cards`, { title, columnId: colId, boardId: id, position });
      // Event handles the UI update
    } catch(err) {
      toast.error('Failed to create card');
    }
  };

  const deleteCard = async (cardId) => {
    try {
      await axios.delete(`/cards/${cardId}`);
    } catch(err) {
      toast.error('Failed to delete card');
    }
  };

  if (loading) return <div className="p-8 text-slate-800 dark:text-white">Loading board...</div>;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-background overflow-hidden transition-colors">
      <div className="px-6 py-4 border-b border-slate-300 dark:border-slate-700 bg-white dark:bg-surface flex justify-between items-center shadow-sm relative z-10 transition-colors">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">{board?.title}</h2>
          
          <div className="flex -space-x-2">
            {Object.keys(activeUsers).map((uid, i) => (
              <div key={uid} className="w-8 h-8 rounded-full border-2 border-white dark:border-surface bg-primary flex items-center justify-center text-xs text-white font-bold" title="Active user">
                {uid.substring(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search cards..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full text-sm outline-none focus:border-primary text-slate-700 dark:text-slate-200 w-64 transition-all"
            />
          </div>
          
          <button 
            onClick={handleUndo} 
            disabled={moveHistory.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            <Undo2 size={16} /> Undo
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full items-start">
            {columnOrder.map((colId) => {
              const column = columns[colId];
              if (!column) return null;
              
              const filteredCards = column.cards.filter(c => 
                c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (c.labels && c.labels.some(l => l.toLowerCase().includes(searchQuery.toLowerCase())))
              );

              return (
                <div key={column._id} className="bg-white dark:bg-surface border border-slate-300 dark:border-slate-700 rounded-xl w-80 flex-shrink-0 flex flex-col max-h-full shadow-lg transition-colors group/col">
                  <div className="p-4 border-b border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-t-xl flex justify-between items-center group transition-colors">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 flex-1">
                      <input 
                        className="bg-transparent border-none outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-800 rounded px-1 -ml-1 w-full truncate"
                        defaultValue={column.title}
                        onBlur={async (e) => {
                          const newTitle = e.target.value.trim();
                          if (newTitle && newTitle !== column.title) {
                             try {
                               await axios.patch(`/columns/${column._id}`, { title: newTitle });
                               setColumns(prev => ({...prev, [column._id]: {...prev[column._id], title: newTitle}}));
                             } catch(err) {
                               toast.error('Failed to update column title');
                               e.target.value = column.title;
                             }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.target.blur();
                        }}
                      />
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{column.cards?.length || 0}</span>
                      <button 
                         className="text-slate-400 hover:text-red-500 opacity-0 group-hover/col:opacity-100 transition-opacity"
                         onClick={async () => {
                           if(window.confirm('Delete this column and all its cards?')) {
                              try {
                                await axios.delete(`/columns/${column._id}`);
                                setColumnOrder(prev => prev.filter(id => id !== column._id));
                                setColumns(prev => {
                                  const next = {...prev};
                                  delete next[column._id];
                                  return next;
                                });
                              } catch(err) {
                                toast.error('Failed to delete column');
                              }
                           }
                         }}
                      >
                         <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <Droppable droppableId={column._id}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-3 flex-1 overflow-y-auto custom-scrollbar transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50 dark:bg-slate-700/50' : ''}`}
                        style={{ minHeight: '150px' }}
                      >
                        {filteredCards.map((card, index) => {
                          const isHighlighted = searchQuery && card.title.toLowerCase().includes(searchQuery.toLowerCase());
                          
                          return (
                            <Draggable key={card._id} draggableId={card._id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => setSelectedCard(card)}
                                  className={`mb-3 p-4 bg-white dark:bg-slate-800 border ${snapshot.isDragging || isHighlighted ? 'border-primary ring-1 ring-primary shadow-md scale-[1.02] z-50' : 'border-slate-300 dark:border-slate-600'} rounded-lg shadow-sm hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-200 text-sm cursor-pointer group/card`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2 max-w-[85%]">
                                      <GripVertical size={16} className="text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
                                      <span className="text-slate-700 dark:text-slate-200 font-medium break-words leading-tight">{card.title}</span>
                                    </div>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); deleteCard(card._id); }} 
                                      className="text-slate-400 hover:text-red-500 opacity-0 group-hover/card:opacity-100 transition-opacity"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                  
                                  {card.labels && card.labels.length > 0 && (
                                    <div className="mt-3 flex gap-1.5 flex-wrap ml-6">
                                      {card.labels.map((lbl, i) => (
                                        <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-medium">{lbl}</span>
                                      ))}
                                    </div>
                                  )}
                                  
                                </div>
                              )}
                            </Draggable>
                          )
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  <div className="p-3 border-t border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl transition-colors">
                    <button 
                      onClick={() => handleAddCard(column._id)}
                      className="w-full flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 py-2 rounded transition-colors text-sm font-medium"
                    >
                      <Plus size={16} /> Add Card
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="bg-slate-100/50 dark:bg-slate-800/30 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl w-80 flex-shrink-0 flex items-center justify-center hover:border-primary dark:hover:border-primary transition-colors cursor-pointer group"
                 onClick={async () => {
                   const title = prompt('Enter column title:');
                   if (!title) return;
                   try {
                     const res = await axios.post('/columns', { title, boardId: id, position: columnOrder.length });
                     setColumns(prev => ({...prev, [res.data._id]: {...res.data, cards: []}}));
                     setColumnOrder(prev => [...prev, res.data._id]);
                   } catch(err) {
                     toast.error('Failed to create column');
                   }
                 }}
                 style={{ minHeight: '150px' }}
            >
               <div className="text-slate-500 dark:text-slate-400 font-medium group-hover:text-primary transition-colors flex items-center gap-2">
                 <Plus size={20} /> Add Column
               </div>
            </div>
          </div>
        </DragDropContext>
      </div>

      {selectedCard && (
        <CardModal 
          card={selectedCard} 
          onClose={() => setSelectedCard(null)} 
          onUpdate={(updatedCard) => {
            // locally update UI just in case socket is delayed, but socket update handles actual sync
            setSelectedCard(updatedCard);
          }} 
        />
      )}
    </div>
  );
};

export default BoardView;
