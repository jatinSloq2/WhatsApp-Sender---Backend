const express = require('express');
const router = express.Router();
const sendMessageRoutes = require('./sendMessage.routes');
const sessionRoutes = require('./session.routes');

router.use('/sessions', sessionRoutes);
router.use('/message', sendMessageRoutes);

module.exports = router;