const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  title: { type: String, required: true },
  columnOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Column' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Board', boardSchema);
