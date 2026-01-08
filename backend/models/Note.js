const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    default: 'Untitled Note'
  },
  content: {
    type: String,
    default: ''
  },
  preview: {
    type: String,
    default: ''
  },
  google_doc_url: String,
  is_favorite: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000)
  },
  updated_at: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000)
  }
});

module.exports = mongoose.model('Note', noteSchema);
