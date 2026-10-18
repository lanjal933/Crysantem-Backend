const express = require('express');
const router = express.Router();
const { register, login, googleAuth, getProfile, requestEmailCode, verifyEmailCode, refreshGoogleToken } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter, emailCodeLimiter } = require('../middleware/rateLimiter');
// const { registerValidation, loginValidation, emailCodeValidation } = require('../middleware/validator');  // Desactivado temporalmente

router.post('/register', authLimiter, register);  // Sin validación temporalmente
router.post('/login', authLimiter, login);  // Sin validación temporalmente
router.post('/email/request-code', emailCodeLimiter, requestEmailCode);
router.post('/email/verify-code', authLimiter, verifyEmailCode);  // Sin validación temporalmente
router.get('/google', (req, res) => {
  const config = require('../config/config');
  const { state, scopes, redirectUrl } = req.query;

  console.log('=== GOOGLE OAUTH REQUEST ===');
  console.log('Scopes recibidos:', scopes);
  console.log('State recibido:', state);
  console.log('Redirect URL recibido:', redirectUrl);

  // Usar scopes específicos del plan o scopes por defecto
  let oauthScopes = scopes || 'email profile';
  
  // Si no se proporcionan scopes, verificar si hay un state que indique el plan
  if (!scopes && state) {
    const planScopes = {
      responde: 'email profile',
      asiste: 'email profile https://www.googleapis.com/auth/spreadsheets',
      automatiza: 'email profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar',
      intelligence: 'email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/gmail.send'
    };
    oauthScopes = planScopes[state] || 'email profile';
  }
  
  console.log('Scopes a usar:', oauthScopes);
  
  // Codificar redirectUrl en el state para recuperarlo en el callback
  // Si redirectUrl existe, usarlo como state principal
  const stateWithRedirect = redirectUrl 
    ? encodeURIComponent(redirectUrl)
    : state || '';
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.google.clientId}&redirect_uri=${encodeURIComponent(config.google.redirectUri)}&response_type=code&scope=${encodeURIComponent(oauthScopes)}&state=${stateWithRedirect}&access_type=offline&prompt=consent`;
  
  console.log('Auth URL generada:', authUrl);
  
  res.json({ authUrl });
});
router.get('/google/callback', googleAuth);
router.post('/google/refresh', authenticateToken, refreshGoogleToken);
router.get('/profile', authenticateToken, getProfile);

module.exports = router;
