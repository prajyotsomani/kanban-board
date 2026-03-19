const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  columnId: { type: mongoose.Schema.Types.ObjectId, ref: 'Column', required: true },
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  labels: [{ type: String }],
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dueDate: { type: Date },
  position: { type: Number, required: true },
  version: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true, optimisticConcurrency: true, versionKey: 'version' });

module.exports = mongoose.model('Card', cardSchema);
