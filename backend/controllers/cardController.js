const Card = require('../models/Card');
const Board = require('../models/Board');
const Workspace = require('../models/Workspace');

const checkEditorRole = async (boardId, userId) => {
  const board = await Board.findById(boardId);
  if (!board) return false;
  const workspace = await Workspace.findById(board.workspaceId);
  if (!workspace) return false;
  
  const membership = workspace.members.find(m => m.userId.toString() === userId.toString());
  if (!membership || membership.role === 'viewer') return false;
  return true;
};

const createCard = async (req, res) => {
  try {
    const { title, description, columnId, boardId, labels, assignees, dueDate, position } = req.body;
    
    const isEditor = await checkEditorRole(boardId, req.user.id);
    if (!isEditor) return res.status(403).json({ message: 'Must be an editor or owner to create cards' });

    const card = new Card({
      title,
      description,
      columnId,
      boardId,
      labels,
      assignees,
      dueDate,
      position,
      createdBy: req.user.id
    });
    
    await card.save();

    const io = req.app.get('io');
    if (io) {
      io.to(boardId.toString()).emit('card:created', card);
    }

    res.status(201).json(card);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateCard = async (req, res) => {
  try {
    const cardId = req.params.id;
    const patch = req.body;
    
    const card = await Card.findById(cardId);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const isEditor = await checkEditorRole(card.boardId, req.user.id);
    if (!isEditor) return res.status(403).json({ message: 'Must be an editor or owner to update cards' });

    Object.assign(card, patch);
    await card.save();

    const io = req.app.get('io');
    if (io) {
      io.to(card.boardId.toString()).emit('card:updated', {
        cardId: card._id,
        patch,
        newVersion: card.version,
        userId: req.user.id
      });
    }

    res.json(card);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteCard = async (req, res) => {
  try {
    const cardId = req.params.id;
    
    const card = await Card.findById(cardId);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const isEditor = await checkEditorRole(card.boardId, req.user.id);
    if (!isEditor) return res.status(403).json({ message: 'Must be an editor or owner to delete cards' });

    await Card.findByIdAndDelete(cardId);

    const io = req.app.get('io');
    if (io) {
      io.to(card.boardId.toString()).emit('card:deleted', { cardId });
    }

    res.json({ message: 'Card deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { createCard, updateCard, deleteCard };
