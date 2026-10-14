const supabase = require('../config/supabase');
const { generateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { sendVerificationCode } = require('../services/emailService');
const { registerValidation, loginValidation, emailCodeValidation } = require('../middleware/validator');

// Asegurar que el usuario exista en myia_users
// NOTA: refresh_token se maneja en user_google_tokens, no en myia_users
const ensureMyiaUser = async (userId, email, googleId = null, scopes = ['email', 'profile']) => {
  try {
    const { data: existingMyiaUser } = await supabase
      .from('myia_users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingMyiaUser) {
      await supabase.from('myia_users').insert({
        id: userId,
        email: email,
        google_id: googleId,
        scopes: scopes
      });
    }
  } catch (error) {
    console.error('Error ensuring myia_user:', error);
  }
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validación ya manejada por middleware registerValidation
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password_hash: passwordHash,
          auth_provider: 'email',
          email_verified: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error en registro:', error);
      return res.status(500).json({ error: 'Error al registrar usuario' });
    }

    // Inicializar límites de mensajes en user_message_limits
    const now = new Date();
    await supabase.from('user_message_limits').insert([
      {
        email: email,
        monthly_message_limit: 50000,
        messages_used: 0,
        current_month: now.getMonth() + 1,
        current_year: now.getFullYear(),
        is_blocked: false,
      },
    ]);

    // Asegurar que el usuario exista en myia_users
    await ensureMyiaUser(newUser.id, email);

    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
      token,
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validación ya manejada por middleware loginValidation
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Permitir login con contraseña si el usuario tiene password_hash
    // independientemente del auth_provider
    if (!user.password_hash) {
      return res.status(400).json({ error: 'Este usuario no tiene contraseña configurada. Usa el método de registro original.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Asegurar que el usuario exista en myia_users
    await ensureMyiaUser(user.id, user.email);

    const token = generateToken(user);

    res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { code, state } = req.query;

    console.log('=== GOOGLE OAUTH CALLBACK ===');
    console.log('Code:', code ? 'present' : 'missing');
    console.log('State:', state);

    if (!code) {
      return res.status(400).json({ error: 'Código de autorización requerido' });
    }

    // Extraer redirectUrl del state si existe
    let redirectUrl = null;
    let plan = state;
    
    if (state && state.includes('|')) {
      const parts = state.split('|');
      plan = parts[0];
      redirectUrl = decodeURIComponent(parts[1]) || null;
      console.log('Plan extraído:', plan);
      console.log('Redirect URL extraído:', redirectUrl);
    }

    const axios = require('axios');
    const config = require('../config/config');

    // Solicitar refresh token explícitamente
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      redirect_uri: config.google.redirectUri,
      grant_type: 'authorization_code',
      access_type: 'offline', // Importante para obtener refresh token
      prompt: 'consent', // Forzar consentimiento para obtener refresh token
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    if (!refresh_token) {
      console.warn('No se obtuvo refresh token de Google. Esto puede ocurrir si el usuario ya autorizó previamente sin offline access.');
    }

    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { id: googleId, email, name, picture } = userInfoResponse.data;

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    let user;
    let userScopes = ['email', 'profile']; // Scopes por defecto

    if (existingUser) {
      // Permitir Google OAuth si el email coincide, independientemente del auth_provider
      // Esto permite vincular Google a cuentas existentes
      
      const tokenData = {
        user_id: existingUser.id,
        access_token: access_token,
        email: email,
        email_verified: true,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
      };

      // Solo actualizar refresh_token si se obtuvo uno nuevo
      if (refresh_token) {
        tokenData.refresh_token = refresh_token;
      }

      await supabase
        .from('user_google_tokens')
        .upsert(tokenData);

      // Actualizar auth_provider si no era google
      if (existingUser.auth_provider !== 'google') {
        await supabase
          .from('users')
          .update({ auth_provider: 'google', avatar_url: picture || existingUser.avatar_url })
          .eq('id', existingUser.id);
      }

      user = existingUser;
    } else {
      console.log('Creando nuevo usuario con Google:', { name, email, picture });

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            name,
            email,
            auth_provider: 'google',
            email_verified: true,
            avatar_url: picture,
          },
        ])
        .select()
        .single();

      console.log('Resultado de inserción:', { newUser, insertError });

      if (insertError || !newUser) {
        console.error('Error al crear usuario:', insertError);
        return res.status(500).json({ error: 'Error al crear usuario', details: insertError?.message });
      }

      const tokenData = {
        user_id: newUser.id,
        access_token: access_token,
        email: email,
        email_verified: true,
        verified_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
      };

      if (refresh_token) {
        tokenData.refresh_token = refresh_token;
      }

      await supabase.from('user_google_tokens').insert([tokenData]);

      // Inicializar límites de mensajes
      const now = new Date();
      await supabase.from('user_message_limits').insert([
        {
          email: email,
          monthly_message_limit: 50000,
          messages_used: 0,
          current_month: now.getMonth() + 1,
          current_year: now.getFullYear(),
          is_blocked: false,
        },
      ]);

      // Asegurar que el usuario exista en myia_users (sin refresh_token duplicado)
      await ensureMyiaUser(newUser.id, email, googleId, userScopes);

      user = newUser;
    }

    const token = generateToken(user);

    // Si viene de MyIA con un plan en el state, guardarlo y redirigir con el plan en la URL
    if (plan) {
      // Definir scopes según el plan
      const planScopes = {
        responde: ['email', 'profile'],
        asiste: ['email', 'profile', 'https://www.googleapis.com/auth/spreadsheets'],
        automatiza: ['email', 'profile', 'https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/calendar'],
        intelligence: ['email', 'profile', 'https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/gmail.send']
      };
      
      userScopes = planScopes[plan] || ['email', 'profile'];
      
      // Actualizar myia_users con los scopes del plan (refresh_token en user_google_tokens)
      await supabase.from('myia_users').upsert({
        id: user.id,
        email: email,
        google_id: googleId,
        scopes: userScopes,
        selected_plan: plan,
        updated_at: new Date().toISOString()
      });
      
      // Redirigir directamente al resumen después de OAuth (o a la URL de procedencia si existe)
      const targetUrl = redirectUrl || `${config.appUrl}/myia-summary.html?token=${token}&plan=${plan}&google_connected=true`;
      console.log('=== REDIRIGIENDO DESPUÉS DE OAUTH ===');
      console.log('Target URL:', targetUrl);
      
      res.redirect(targetUrl);
    } else {
      // Redirección normal - usar redirectUrl si existe, si no ir a index.html
      const targetUrl = redirectUrl || `${config.appUrl}/index.html?token=${token}`;
      
      // Guardar scopes básicos (refresh_token en user_google_tokens)
      await supabase.from('myia_users').upsert({
        id: user.id,
        email: email,
        google_id: googleId,
        scopes: userScopes,
        updated_at: new Date().toISOString()
      });
      
      console.log('=== REDIRIGIENDO A LANDING O URL DE PROCEDENCIA ===');
      console.log('Target URL:', targetUrl);
      
      res.redirect(targetUrl);
    }
  } catch (error) {
    console.error('Error en Google Auth:', error);
    const config = require('../config/config');
    res.redirect(`${config.appUrl}/index.html?error=auth_failed`);
  }
};

const getProfile = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, auth_provider, email_verified, avatar_url, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const requestEmailCode = async (req, res) => {
  try {
    const { email } = req.body;

    // Validación básica (email ya validado por middleware)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await supabase
      .from('email_verification_codes')
      .insert([
        {
          email,
          code,
          expires_at: expiresAt.toISOString(),
        },
      ]);

    const emailResult = await sendVerificationCode(email, code);

    if (!emailResult.success) {
      console.error('Error al enviar email:', emailResult.error);
      return res.status(500).json({ error: 'Error al enviar email de verificación' });
    }

    res.json({
      message: 'Código enviado exitosamente',
      expiresIn: 600,
    });
  } catch (error) {
    console.error('Error al solicitar código:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const verifyEmailCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email y código son requeridos' });
    }

    const { data: verificationCode, error: codeError } = await supabase
      .from('email_verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (codeError || !verificationCode) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    await supabase
      .from('email_verification_codes')
      .update({ used: true, updated_at: new Date().toISOString() })
      .eq('id', verificationCode.id);

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    let user;
    if (existingUser) {
      // Permitir login por email independientemente del auth_provider
      user = existingUser;
    } else {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            email,
            auth_provider: 'email',
            email_verified: true,
            name: email.split('@')[0],
          },
        ])
        .select()
        .single();

      if (insertError || !newUser) {
        console.error('Error al crear usuario:', insertError);
        return res.status(500).json({ error: 'Error al crear usuario' });
      }

      const now = new Date();
      await supabase.from('user_message_limits').insert([
        {
          email: email,
          monthly_message_limit: 50000,
          messages_used: 0,
          current_month: now.getMonth() + 1,
          current_year: now.getFullYear(),
          is_blocked: false,
        },
      ]);

      // Asegurar que el usuario exista en myia_users
      await ensureMyiaUser(newUser.id, email);

      user = newUser;
    }

    const token = generateToken(user);

    res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('Error al verificar código:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const refreshGoogleToken = async (req, res) => {
  try {
    const { user_id } = req.user;

    const { data: tokenData, error } = await supabase
      .from('user_google_tokens')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (error || !tokenData) {
      return res.status(404).json({ error: 'No se encontraron tokens de Google para este usuario' });
    }

    if (!tokenData.refresh_token) {
      return res.status(400).json({ error: 'No hay refresh token disponible. El usuario debe volver a autenticarse con Google con offline access.' });
    }

    const axios = require('axios');
    const config = require('../config/config');

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      refresh_token: tokenData.refresh_token,
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      grant_type: 'refresh_token',
    });

    const { access_token, expires_in } = tokenResponse.data;

    // Actualizar el access token en la base de datos
    await supabase
      .from('user_google_tokens')
      .update({
        access_token: access_token,
        expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user_id);

    res.json({
      message: 'Token refrescado exitosamente',
      access_token,
      expires_in,
    });
  } catch (error) {
    console.error('Error al refrescar token:', error);
    res.status(500).json({ error: 'Error al refrescar token' });
  }
};

module.exports = { register, login, googleAuth, getProfile, requestEmailCode, verifyEmailCode, refreshGoogleToken };
