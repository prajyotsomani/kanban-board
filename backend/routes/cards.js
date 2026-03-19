const express = require('express');
const router = express.Router();
const { createCard, updateCard, deleteCard } = require('../controllers/cardController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, createCard);
router.patch('/:id', authMiddleware, updateCard);
router.delete('/:id', authMiddleware, deleteCard);

module.exports = router;
