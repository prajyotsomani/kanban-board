const Column = require('../models/Column');
const Board = require('../models/Board');
const Workspace = require('../models/Workspace');

const checkEditorRole = async (boardId, userId) => {
  const board = await Board.findById(boardId);
  if (!board) return false;
  const workspace = await Workspace.findById(board.workspaceId);
  if (!workspace) return false;
  const membership = workspace.members.find(m => m.userId.toString() === userId.toString());
  if (!membership || membership.role === 'viewer') return false;
  return { board, workspace };
};

const createColumn = async (req, res) => {
  try {
    const { title, boardId, position } = req.body;
    const authContext = await checkEditorRole(boardId, req.user.id);
    if (!authContext) return res.status(403).json({ message: 'Must be an editor or owner' });

    const column = new Column({ title, boardId, position });
    await column.save();

    authContext.board.columnOrder.push(column._id);
    await authContext.board.save();

    res.status(201).json(column);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateColumn = async (req, res) => {
  try {
    const colId = req.params.id;
    const { title } = req.body;
    const column = await Column.findById(colId);
    if (!column) return res.status(404).json({ message: 'Column not found' });

    const authContext = await checkEditorRole(column.boardId, req.user.id);
    if (!authContext) return res.status(403).json({ message: 'Must be an editor or owner' });

    column.title = title;
    await column.save();

    res.json(column);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteColumn = async (req, res) => {
  try {
    const colId = req.params.id;
    const column = await Column.findById(colId);
    if (!column) return res.status(404).json({ message: 'Column not found' });

    const authContext = await checkEditorRole(column.boardId, req.user.id);
    if (!authContext) return res.status(403).json({ message: 'Must be an editor or owner' });

    await Column.findByIdAndDelete(colId);

    // remove from board
    authContext.board.columnOrder = authContext.board.columnOrder.filter(id => id.toString() !== colId);
    await authContext.board.save();

    res.json({ message: 'Column deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { createColumn, updateColumn, deleteColumn };
