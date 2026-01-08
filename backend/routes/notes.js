const express = require('express');
const router = express.Router();
const Note = require('../models/Note');

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Get all notes for user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user._id }).sort({ created_at: -1 });
    res.json({ 
      success: true, 
      notes: notes.map(note => ({
        id: note._id.toString(),
        title: note.title,
        content: note.content,
        preview: note.preview || note.content.substring(0, 150),
        google_doc_url: note.google_doc_url,
        is_favorite: note.is_favorite,
        created_at: note.created_at,
        updated_at: note.updated_at
      }))
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Get single note
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json({
      success: true,
      note: {
        id: note._id.toString(),
        title: note.title,
        content: note.content,
        preview: note.preview,
        google_doc_url: note.google_doc_url,
        is_favorite: note.is_favorite,
        created_at: note.created_at,
        updated_at: note.updated_at
      }
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// Create note
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { title, content, preview } = req.body;
    
    const note = await Note.create({
      userId: req.user._id,
      title: title || 'Untitled Note',
      content: content || '',
      preview: preview || content?.substring(0, 150) || ''
    });
    
    res.json({
      success: true,
      note: {
        id: note._id.toString(),
        title: note.title,
        content: note.content,
        preview: note.preview,
        created_at: note.created_at
      }
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update note
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { title, content } = req.body;
    
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { 
        title,
        content,
        preview: content?.substring(0, 150) || '',
        updated_at: Math.floor(Date.now() / 1000)
      },
      { new: true }
    );
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json({ success: true, note });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete note
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Toggle favorite
router.post('/:id/favorite', isAuthenticated, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    note.is_favorite = !note.is_favorite;
    await note.save();
    
    res.json({ 
      success: true, 
      is_favorite: note.is_favorite 
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

module.exports = router;
