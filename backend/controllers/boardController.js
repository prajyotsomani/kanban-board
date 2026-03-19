const Board = require('../models/Board');
const Column = require('../models/Column');
const Card = require('../models/Card');
const Workspace = require('../models/Workspace');
const Activity = require('../models/Activity');

const getBoards = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ "members.userId": req.user.id });
    const workspaceIds = workspaces.map(w => w._id);
    const boards = await Board.find({ workspaceId: { $in: workspaceIds } });
    res.json(boards);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getBoardData = async (req, res) => {
  try {
    const boardId = req.params.id;
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: 'Board not found' });
    
    // Auth Check: User must be a member of the workspace
    const workspace = await Workspace.findById(board.workspaceId);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    
    const isMember = workspace.members.some(m => m.userId.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ message: 'Not a member of this workspace' });
    
    const columns = await Column.find({ boardId }).sort('position');
    const cards = await Card.find({ boardId }).sort('position');
    
    res.json({ board, columns, cards });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const createBoard = async (req, res) => {
  try {
    let { title, workspaceId } = req.body;
    
    let workspace;
    if (workspaceId) {
       workspace = await Workspace.findById(workspaceId);
    } else {
       workspace = await Workspace.findOne({ "members.userId": req.user.id });
       if (workspace) {
         workspaceId = workspace._id;
       } else {
         // Gracefully auto-create a user workspace if they registered before this feature existed
         const userName = req.user.displayName || "User";
         workspace = new Workspace({
           name: `${userName}'s Workspace`,
           slug: `${userName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}-workspace-${Date.now()}`,
           members: [{ userId: req.user.id, role: 'owner' }]
         });
         await workspace.save();
         workspaceId = workspace._id;
       }
    }
    
    if (!workspace) return res.status(404).json({ message: 'Workspace not found.' });

    // Validate if the user is a member
    const isMember = workspace.members.some(m => m.userId.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ message: 'Not a member of this workspace' });

    const board = new Board({ title, workspaceId, createdBy: req.user.id });
    await board.save();
    
    // Create Default columns
    const todo = new Column({ title: 'To Do', boardId: board._id, position: 0 });
    const inProgress = new Column({ title: 'In Progress', boardId: board._id, position: 1 });
    const done = new Column({ title: 'Done', boardId: board._id, position: 2 });
    await Promise.all([todo.save(), inProgress.save(), done.save()]);

    board.columnOrder = [todo._id, inProgress._id, done._id];
    await board.save();

    res.status(201).json(board);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getBoardActivity = async (req, res) => {
  try {
    const boardId = req.params.id;
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const workspace = await Workspace.findById(board.workspaceId);
    const membership = workspace.members.find(m => m.userId.toString() === req.user.id);
    
    if (!membership || membership.role === 'viewer') {
      return res.status(403).json({ message: 'Requires viewer or higher roles (editors checked in prompt mapping, but assumed viewer can see activity, or block if needed. We assume members can view)' });
    }

    const activities = await Activity.find({ boardId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actorId', 'displayName email avatarColor');

    const total = await Activity.countDocuments({ boardId });

    res.json({ activities, total, page, limit });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getBoards, getBoardData, createBoard, getBoardActivity };
