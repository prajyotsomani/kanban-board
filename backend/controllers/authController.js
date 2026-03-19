const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Workspace = require('../models/Workspace');

const register = async (req, res) => {
  try {
    const { displayName, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ displayName, email, passwordHash: hashedPassword });
    await user.save();

    const workspace = new Workspace({
      name: `${displayName}'s Workspace`,
      slug: `${displayName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}-workspace-${Date.now()}`,
      members: [{ userId: user._id, role: 'owner' }]
    });
    await workspace.save();

    user.workspaces = [workspace._id];
    await user.save();

    const payload = { id: user.id, displayName: user.displayName };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, refreshToken, user: { id: user.id, displayName: user.displayName, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { id: user.id, displayName: user.displayName };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.json({ token, refreshToken, user: { id: user.id, displayName: user.displayName, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const payload = { id: decoded.id, displayName: decoded.displayName };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
    const newRefreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.json({ token, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(403).json({ message: 'Invalid refresh token', error: err.message });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { register, login, refresh, me };
