const express = require('express');
const router = express.Router();
const Folder = require('../models/Folder');

// Middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Get all folders
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const folders = await Folder.find({ userId: req.user._id }).sort({ created_at: -1 });
    res.json({
      success: true,
      folders: folders.map(folder => ({
        id: folder._id.toString(),
        name: folder.name,
        note_ids: folder.note_ids,
        created_at: folder.created_at
      }))
    });
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Create folder
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { name } = req.body;
    
    const folder = await Folder.create({
      userId: req.user._id,
      name,
      note_ids: []
    });
    
    res.json({
      success: true,
      folder: {
        id: folder._id.toString(),
        name: folder.name,
        note_ids: folder.note_ids
      }
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Rename folder
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { name } = req.body;
    
    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name },
      { new: true }
    );
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    res.json({ success: true, folder });
  } catch (error) {
    console.error('Rename folder error:', error);
    res.status(500).json({ error: 'Failed to rename folder' });
  }
});

// Delete folder
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const folder = await Folder.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    res.json({ success: true, message: 'Folder deleted' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// Add notes to folder
router.post('/:id/notes', isAuthenticated, async (req, res) => {
  try {
    const { note_ids } = req.body;
    
    const folder = await Folder.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    // Add note IDs (avoid duplicates)
    const newNoteIds = note_ids.filter(id => !folder.note_ids.includes(id));
    folder.note_ids.push(...newNoteIds);
    await folder.save();
    
    res.json({ success: true, folder });
  } catch (error) {
    console.error('Add notes error:', error);
    res.status(500).json({ error: 'Failed to add notes' });
  }
});

module.exports = router;
