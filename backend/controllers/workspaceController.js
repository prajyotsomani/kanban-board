const Workspace = require('../models/Workspace');
const User = require('../models/User');

const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      $or: [
        { 'members.userId': req.user.id },
        { owner: req.user.id } // Wait, owner isn't there in new schema, but we'll assume member role 'owner'
      ]
    });
    // With new schema, everyone is a member. We should just check members.userId
    const ws = await Workspace.find({ 'members.userId': req.user.id }).populate('members.userId', 'displayName email avatarColor');
    res.json(ws);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const createWorkspace = async (req, res) => {
  try {
    const { name, slug } = req.body;
    const existing = await Workspace.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: 'Workspace with this slug already exists' });
    }

    const workspace = new Workspace({
      name,
      slug,
      members: [{ userId: req.user.id, role: 'owner' }]
    });

    await workspace.save();

    // Also add workspace to User.workspaces
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { workspaces: workspace._id } });

    res.status(201).json(workspace);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const workspaceId = req.params.id;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    const isOwner = workspace.members.some(m => m.userId.toString() === req.user.id && m.role === 'owner');
    if (!isOwner) return res.status(403).json({ message: 'Only owners can invite members' });

    const userToInvite = await User.findOne({ email });
    if (!userToInvite) return res.status(404).json({ message: 'User not found with this email' });

    const alreadyMember = workspace.members.some(m => m.userId.toString() === userToInvite._id.toString());
    if (alreadyMember) return res.status(400).json({ message: 'User is already a member' });

    workspace.members.push({ userId: userToInvite._id, role: role || 'viewer' });
    await workspace.save();

    await User.findByIdAndUpdate(userToInvite._id, { $addToSet: { workspaces: workspace._id } });

    res.json({ message: 'Member invited successfully', workspace });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getWorkspaces, createWorkspace, inviteMember };
