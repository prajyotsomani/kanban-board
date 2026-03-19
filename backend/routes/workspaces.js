const express = require('express');
const router = express.Router();
const { getWorkspaces, createWorkspace, inviteMember } = require('../controllers/workspaceController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getWorkspaces);
router.post('/', authMiddleware, createWorkspace);
router.post('/:id/invite', authMiddleware, inviteMember);

module.exports = router;
