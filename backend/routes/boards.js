const express = require('express');
const router = express.Router();
const { getBoards, getBoardData, createBoard, getBoardActivity } = require('../controllers/boardController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getBoards);
router.post('/', authMiddleware, createBoard);
router.get('/:id', authMiddleware, getBoardData);
router.get('/:id/activity', authMiddleware, getBoardActivity);

module.exports = router;
