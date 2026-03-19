const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String, required: true },
  avatarColor: { type: String },
  workspaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
