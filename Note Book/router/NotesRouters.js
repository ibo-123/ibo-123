const express = require('express');
const router = express.Router();

const NoteControllers = require('../controller/NoteController');

router.route('/')
       .get(NoteControllers.getAllNotes)
       .post(NoteControllers.createNote)
       .delete(NoteControllers.DeleteNote)
router.route('/:title').put(NoteControllers.updateNote)
module.exports = router;

