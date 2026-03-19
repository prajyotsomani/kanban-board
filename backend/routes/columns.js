const express = require('express');
const router = express.Router();
const { createColumn, updateColumn, deleteColumn } = require('../controllers/columnController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, createColumn);
router.patch('/:id', authMiddleware, updateColumn);
router.delete('/:id', authMiddleware, deleteColumn);

module.exports = router;
