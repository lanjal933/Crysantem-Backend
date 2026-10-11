const express = require('express');
const router = express.Router();
const { sendMessage } = require('../controllers/aiController');
const { aiLimiter } = require('../middleware/rateLimiter');
// const { aiMessageValidation } = require('../middleware/validator');  // Desactivado temporalmente

router.post('/message', aiLimiter, sendMessage);  // Sin validación temporalmente

module.exports = router;
