const express = require('express');
const router = express.Router();
const controller = require('../controller/sendMessage.controller');

// router.get('/chatlist/:id', controller.getChatList);
router.post('/send', controller.sendMessage);
router.post('/bulk', controller.bulkMessageSender);

module.exports = router;