const express = require('express');
const router = express.Router();
const controller = require('../controller/session.controller');

router.post('/create', controller.createSession);
router.get('/status/:sessionId', controller.getSessionStatus);
// router.get('/qr/:sessionId', controller.getQR);
router.delete('/delete/:sessionId', controller.deleteSession);
router.get('/list', controller.listSessions);
router.post('/retrysession', controller.retryDisconectedSession);

module.exports = router;