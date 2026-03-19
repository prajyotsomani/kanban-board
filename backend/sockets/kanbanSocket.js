const Card = require('../models/Card');
const Column = require('../models/Column');
const Board = require('../models/Board');
const jwt = require('jsonwebtoken');

module.exports = (io, socket) => {
  let currentUserId = null;
  let currentBoardId = null;

  // • board:join — Authenticate + subscribe to a board room
  socket.on('board:join', async ({ token, boardId }) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      currentUserId = decoded.id;
      
      for (let room of socket.rooms) {
        if (room !== socket.id) socket.leave(room);
      }
      
      socket.join(boardId);
      currentBoardId = boardId;

      // • board:state — Full board snapshot on join
      const board = await Board.findById(boardId);
      if (board) {
        const columns = await Column.find({ boardId }).lean();
        const cards = await Card.find({ boardId }).lean();
        
        socket.emit('board:state', {
          board,
          columns,
          cards
        });
      }
    } catch (err) {
      socket.emit('unauthorized', { message: 'Invalid token' });
    }
  });

  // • card:move — { cardId, fromColumnId, toColumnId, newPosition, clientVersion }
  socket.on('card:move', async (data) => {
    if (!currentUserId || !currentBoardId) return;
    try {
      const { cardId, fromColumnId, toColumnId, newPosition, clientVersion } = data;
      const card = await Card.findById(cardId);
      if (!card) return;

      if (card.version !== clientVersion) {
        // • card:rejected — Sent only to originator when version conflict detected
        socket.emit('card:rejected', {
          cardId: card._id,
          expectedVersion: card.version,
          currentState: card
        });
        return;
      }

      card.columnId = toColumnId;
      card.position = newPosition;
      await card.save();

      // • card:moved — Broadcast confirmed move to all room members
      io.to(currentBoardId).emit('card:moved', {
        cardId: card._id,
        fromColumnId,
        toColumnId,
        newPosition,
        newVersion: card.version,
        userId: currentUserId
      });
    } catch (err) {
      if (err.name === 'VersionError') {
        const card = await Card.findById(data.cardId);
        socket.emit('card:rejected', {
          cardId: data.cardId,
          expectedVersion: card ? card.version : null,
          currentState: card
        });
      } else {
        console.error('card:move error', err);
      }
    }
  });

  // • card:update — { cardId, patch, clientVersion } — partial field update
  socket.on('card:update', async (data) => {
    if (!currentUserId || !currentBoardId) return;
    try {
      const { cardId, patch, clientVersion } = data;
      const card = await Card.findById(cardId);
      if (!card) return;

      if (card.version !== clientVersion) {
        socket.emit('card:rejected', {
          cardId: card._id,
          expectedVersion: card.version,
          currentState: card
        });
        return;
      }

      Object.assign(card, patch);
      await card.save();

      // • card:updated — Broadcast confirmed patch
      io.to(currentBoardId).emit('card:updated', {
        cardId: card._id,
        patch,
        newVersion: card.version,
        userId: currentUserId
      });
    } catch (err) {
      if (err.name === 'VersionError') {
        const card = await Card.findById(data.cardId);
        socket.emit('card:rejected', {
          cardId: data.cardId,
          expectedVersion: card ? card.version : null,
          currentState: card
        });
      } else {
        console.error('card:update error', err);
      }
    }
  });

  // • card:create — { columnId, title, ... }
  socket.on('card:create', async (data) => {
    if (!currentUserId || !currentBoardId) return;
    try {
      const card = new Card({
        ...data,
        boardId: currentBoardId,
        createdBy: currentUserId
      });
      await card.save();

      io.to(currentBoardId).emit('card:created', card);
    } catch (err) {
      console.error('card:create error', err);
    }
  });

  // • card:delete — { cardId }
  socket.on('card:delete', async (data) => {
    if (!currentUserId || !currentBoardId) return;
    try {
      const { cardId } = data;
      await Card.findByIdAndDelete(cardId);
      
      io.to(currentBoardId).emit('card:deleted', { cardId });
    } catch (err) {
      console.error('card:delete error', err);
    }
  });

  // • user:typing — { cardId } — presence indicator while editing
  socket.on('user:typing', (data) => {
    if (!currentUserId || !currentBoardId) return;
    const { cardId } = data;
    
    // • presence:update — { userId, cardId | null } — who
    socket.to(currentBoardId).emit('presence:update', {
      userId: currentUserId,
      cardId: cardId || null
    });
  });

  socket.on('disconnect', () => {
    if (currentUserId && currentBoardId) {
       socket.to(currentBoardId).emit('presence:update', {
         userId: currentUserId,
         cardId: null
       });
    }
  });
};
