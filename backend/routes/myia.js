const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { generalLimiter } = require('../middleware/rateLimiter');
const { myiaConfigValidation } = require('../middleware/validator');
const axios = require('axios');

// Función simple para generar UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mercado Pago access token (usar directamente en llamadas API)
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || 'TEST-ACCESS_TOKEN';

// Configuración de webhooks por plan (PRODUCTION)
const PLAN_WEBHOOKS = {
  responde: process.env.WEBHOOK_RESPONDE || 'https://n8n-n8n.f6ppdc.easypanel.host/webhook/43f55ce7-5167-436b-83c6-6b7888f1a24d',
  asiste: process.env.WEBHOOK_ASISTE || 'https://n8n-n8n.f6ppdc.easypanel.host/webhook/b3b7d439-87ca-4be8-a0cd-aae9578aea8e',
  automatiza: process.env.WEBHOOK_AUTOMATIZA || 'https://n8n-n8n.f6ppdc.easypanel.host/webhook/03d59107-4e07-4677-af74-ba98ead56518',
  intelligence: process.env.WEBHOOK_INTELLIGENCE || 'https://n8n-n8n.f6ppdc.easypanel.host/webhook/bd0ee850-a7a8-469c-a05d-93e389938b38'
};

// Aceptar términos y condiciones
router.post('/accept-terms', generalLimiter, async (req, res) => {
  try {
    const { userId, termsVersion } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId es requerido' });
    }

    const version = termsVersion || '2026-10-12';

    // Obtener IP y User Agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    console.log('Registrando aceptación de términos:', { userId, version, ipAddress });

    // Insertar aceptación en la tabla
    const { data, error } = await supabase
      .from('terms_acceptances')
      .insert({
        user_id: userId,
        terms_version: version,
        ip_address: ipAddress,
        user_agent: userAgent
      })
      .select()
      .single();

    if (error) {
      // Si el error es por violación de unicidad (ya aceptó), está bien
      if (error.code === '23505') {
        console.log('Usuario ya había aceptado esta versión de términos');
        return res.json({ success: true, message: 'Términos ya aceptados anteriormente' });
      }
      console.error('Error al guardar aceptación:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    console.log('Aceptación registrada exitosamente:', data);
    res.json({ success: true, message: 'Términos aceptados exitosamente', data });
  } catch (error) {
    console.error('Error en accept-terms:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verificar si el usuario aceptó los términos
router.get('/check-terms/:userId', generalLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const { version = '2026-10-12' } = req.query;

    console.log('Verificando aceptación de términos:', { userId, version });

    const { data, error } = await supabase
      .from('terms_acceptances')
      .select('*')
      .eq('user_id', userId)
      .eq('terms_version', version)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró aceptación
        return res.json({ success: true, accepted: false });
      }
      console.error('Error al verificar aceptación:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, accepted: true, data });
  } catch (error) {
    console.error('Error en check-terms:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Eliminar página (borrado completo de la base de datos)
router.delete('/delete/:id', generalLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Eliminando página con ID:', id);

    // Eliminar de myia_page_config
    const { error: configError } = await supabase
      .from('myia_page_config')
      .delete()
      .eq('id', id);

    if (configError) {
      console.error('Error al eliminar config:', configError);
      return res.status(500).json({ success: false, error: configError.message });
    }

    console.log('Página eliminada exitosamente:', id);

    res.json({ success: true, message: 'Página eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Proxy para mensajes de chat a n8n (seguro - webhooks solo en backend)
router.post('/chat-message', generalLimiter, async (req, res) => {
  try {
    const { message, pageId, userId, plan } = req.body;

    console.log('=== MENSAJE DE CHAT RECIBIDO ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Page ID:', pageId);
    console.log('User ID:', userId);
    console.log('Plan:', plan);
    console.log('Message:', message);

    // Obtener configuración de la página con información de estado, límites y URLs de integraciones para n8n
    const { data: pageConfig, error: configError } = await supabase
      .from('myia_page_config')
      .select('business_name, slug, system_prompt, plan, is_active, messages_limit, messages_used_this_month, current_month, current_year, user_id, sheets_database_url_get, sheets_database_url_post, sheets_custom_1_url_get, sheets_custom_1_url_post, sheets_custom_2_url_get, sheets_custom_2_url_post, gmail_sender_email')
      .eq('id', pageId)
      .single();

    if (configError || !pageConfig) {
      console.error('Error al obtener configuración de página:', configError);
      return res.status(404).json({ success: false, error: 'Página no encontrada' });
    }

    // VERIFICACIÓN 1: Verificar si el bot está activo
    if (pageConfig.is_active === false) {
      console.log('Bot suspendido - pago pendiente o cancelado');
      return res.status(403).json({
        success: false,
        error: 'Tu bot está temporalmente suspendido. Por favor verifica el estado de tu suscripción.',
        code: 'BOT_SUSPENDED'
      });
    }

    // VERIFICACIÓN 2: Verificar y resetear contador si cambió el mes
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    let needReset = false;
    if (pageConfig.current_month !== currentMonth || pageConfig.current_year !== currentYear) {
      console.log('Cambio de mes detectado - reseteando contador');
      needReset = true;
    }

    if (needReset) {
      await supabase
        .from('myia_page_config')
        .update({
          messages_used_this_month: 0,
          current_month: currentMonth,
          current_year: currentYear,
          last_message_count_reset: now.toISOString()
        })
        .eq('id', pageId);

      pageConfig.messages_used_this_month = 0;
      pageConfig.current_month = currentMonth;
      pageConfig.current_year = currentYear;
    }

    // VERIFICACIÓN 3: Verificar límite de mensajes
    const messageLimit = pageConfig.messages_limit || 0;
    const messagesUsed = pageConfig.messages_used_this_month || 0;

    if (messageLimit > 0 && messagesUsed >= messageLimit) {
      console.log('Límite de mensajes alcanzado:', messagesUsed, '/', messageLimit);
      return res.status(429).json({
        success: false,
        error: `Has alcanzado tu límite mensual de ${messageLimit} mensajes. Tu límite se renovará el próximo mes.`,
        code: 'MESSAGE_LIMIT_REACHED',
        limit: messageLimit,
        used: messagesUsed
      });
    }

    // Obtener webhook URL según el plan (solo en backend)
    const webhookUrl = PLAN_WEBHOOKS[plan] || PLAN_WEBHOOKS.responde;
    console.log('Enviando a webhook del plan:', plan);
    console.log('Slug para n8n:', pageConfig.slug);
    console.log('Mensajes usados:', messagesUsed, '/', messageLimit);

    // Enviar mensaje a n8n con el formato correcto y firma HMAC
    const axios = require('axios');
    const crypto = require('crypto');
    const config = require('../config/config');

    const timestamp = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({
      slug: pageConfig.slug,
      chatInput: message,
      userId: userId,
      // URLs dinámicas de Sheets para n8n
      sheets: {
        database_url_get: pageConfig.sheets_database_url_get,
        database_url_post: pageConfig.sheets_database_url_post,
        custom_1_url_get: pageConfig.sheets_custom_1_url_get,
        custom_1_url_post: pageConfig.sheets_custom_1_url_post,
        custom_2_url_get: pageConfig.sheets_custom_2_url_get,
        custom_2_url_post: pageConfig.sheets_custom_2_url_post
      },
      // Email de Gmail sender
      gmail_sender_email: pageConfig.gmail_sender_email,
      // Información del plan
      plan: pageConfig.plan
    });

    const signature = crypto
      .createHmac('sha256', config.security.n8nWebhookSecret)
      .update(timestamp + payload)
      .digest('hex');

    const response = await axios.post(webhookUrl, {
      slug: pageConfig.slug,          // Identificador único de la página
      chatInput: message,             // Mensaje del usuario
      userId: userId,                 // ID del usuario para obtener tokens OAuth
      system_prompt: pageConfig.system_prompt,  // System prompt del bot (para que la IA use el correcto)
      business_name: pageConfig.business_name,  // Nombre del negocio (para contexto)
      // URLs dinámicas de Sheets para n8n (multitenencia)
      sheets: {
        database_url_get: pageConfig.sheets_database_url_get,
        database_url_post: pageConfig.sheets_database_url_post,
        custom_1_url_get: pageConfig.sheets_custom_1_url_get,
        custom_1_url_post: pageConfig.sheets_custom_1_url_post,
        custom_2_url_get: pageConfig.sheets_custom_2_url_get,
        custom_2_url_post: pageConfig.sheets_custom_2_url_post
      },
      // Email de Gmail sender (multitenencia)
      gmail_sender_email: pageConfig.gmail_sender_email,
      // Información del plan
      plan: pageConfig.plan
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': timestamp.toString()
      },
      timeout: 30000 // 30 segundos timeout
    });

    console.log('Respuesta de n8n recibida:', response.status);

    // ACTUALIZAR contador de mensajes en myia_page_config
    await supabase
      .from('myia_page_config')
      .update({
        messages_used_this_month: messagesUsed + 1
      })
      .eq('id', pageId);

    console.log('Contador de mensajes actualizado en página:', messagesUsed + 1, '/', messageLimit);

    // ACTUALIZAR contador de mensajes en user_message_limits
    if (userId) {
      const { data: userLimits } = await supabase
        .from('user_message_limits')
        .select('messages_used')
        .eq('email', userId)
        .single();

      if (userLimits) {
        await supabase
          .from('user_message_limits')
          .update({
            messages_used: (userLimits.messages_used || 0) + 1
          })
          .eq('email', userId);
        console.log('Contador de mensajes actualizado en usuario:', (userLimits.messages_used || 0) + 1);
      }
    }

    res.json({
      success: true,
      response: response.data.response || response.data.message || response.data.output || response.data || 'Respuesta recibida',
      messages_used: messagesUsed + 1,
      messages_limit: messageLimit
    });
  } catch (error) {
    console.error('Error procesando mensaje de chat:', error.message);
    console.error('Error completo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar el mensaje. Verifica que los webhooks de n8n estén configurados correctamente.'
    });
  }
});

// Guardar configuración de página
router.post('/config', generalLimiter, myiaConfigValidation, async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const logFile = path.join(__dirname, '../debug-config.log');
  
  const log = (message) => {
    console.log(message);
    fs.appendFileSync(logFile, `${new Date().toISOString()} - ${message}\n`);
  };
  
  try {
    const { userId, config } = req.body;
    
    log('=== DATOS RECIBIDOS ===');
    log('userId: ' + userId);
    log('config.integrations_config: ' + JSON.stringify(config.integrations_config));
    log('config.payment_plan: ' + config.payment_plan);
    log('config.payment_method: ' + config.payment_method);
    log('config.google_connected: ' + config.google_connected);

    // Asegurar que el usuario exista en myia_users
    const { data: myiaUser } = await supabase
      .from('myia_users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!myiaUser) {
      const { data: mainUser } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (mainUser) {
        await supabase.from('myia_users').insert({
          id: userId,
          email: mainUser.email,
          scopes: ['email', 'profile']
        });
        console.log('Usuario creado en myia_users:', userId);
      } else {
        return res.status(400).json({ success: false, error: 'Usuario no encontrado' });
      }
    }

    // Verificar si ya existe configuración con el mismo slug
    if (config.slug) {
      const { data: existingSlug } = await supabase
        .from('myia_page_config')
        .select('id')
        .eq('slug', config.slug)
        .single();

      if (existingSlug && (!config.id || existingSlug.id !== config.id)) {
        return res.status(400).json({ success: false, error: 'El slug ya está en uso' });
      }
    }

    // Verificar si ya existe configuración para este usuario
    const { data: existing } = await supabase
      .from('myia_page_config')
      .select('*')
      .eq('user_id', userId)
      .eq('id', config.id || '')
      .single();

    let result;
    let firstInsertError = null;
    let updateError = null;

    // Intento 1: Solo columnas de formato CHAT (sin columnas viejas de diseño web)
    const fullUpdateData = {
      business_name: config.business_name,
      slug: config.slug,
      bot_name: config.bot_name,
      header_subtitle: config.header_subtitle,
      bot_avatar: config.bot_avatar,
      chat_theme: config.chat_theme,
      message_bubble_color: config.message_bubble_color,
      user_bubble_color: config.user_bubble_color,
      background_type: config.background_type,
      background_color: config.background_color,
      background_gradient: config.background_gradient,
      background_image: config.background_image,
      welcome_message: config.welcome_message,
      system_prompt: config.system_prompt,
      ai_model: config.ai_model,
      character_limit: config.character_limit,
      plan: config.plan,
      is_active: config.is_active,
      integrations_config: config.integrations_config || null,
      super_prompt: config.super_prompt || null,
      // Sheets URLs (columnas individuales para n8n - GET y POST separados)
      sheets_database_url_get: config.integrations_config?.sheets?.urlGet || null,
      sheets_database_url_post: config.integrations_config?.sheets?.urlPost || null,
      sheets_custom_1_url_get: config.integrations_config?.sheets?.customSheets?.[0]?.urlGet || null,
      sheets_custom_1_url_post: config.integrations_config?.sheets?.customSheets?.[0]?.urlPost || null,
      sheets_custom_2_url_get: config.integrations_config?.sheets?.customSheets?.[1]?.urlGet || null,
      sheets_custom_2_url_post: config.integrations_config?.sheets?.customSheets?.[1]?.urlPost || null,
      // Gmail (columna individual para n8n)
      gmail_sender_email: config.integrations_config?.gmail?.sender || null,
      // Pagos
      payment_plan: config.payment_plan,
      payment_method: config.payment_method,
      payment_status: config.payment_status,
      subscription_id: config.subscription_id,
      subscription_status: config.subscription_status,
      billing_type: config.billing_type,
      messages_limit: config.messages_limit,
      minimum_months: config.minimum_months,
      google_connected: config.google_connected
    };

    // Intento 2: Solo columnas básicas (CON INTEGRACIONES)
    const basicUpdateData = {
      business_name: config.business_name,
      slug: config.slug,
      background_type: config.background_type,
      background_color: config.background_color,
      bot_name: config.bot_name,
      header_subtitle: config.header_subtitle,
      bot_avatar: config.bot_avatar,
      chat_theme: config.chat_theme,
      message_bubble_color: config.message_bubble_color,
      user_bubble_color: config.user_bubble_color,
      background_image: config.background_image,
      welcome_message: config.welcome_message,
      system_prompt: config.system_prompt,
      ai_model: config.ai_model,
      character_limit: config.character_limit,
      plan: config.plan,
      is_active: config.is_active,
      integrations_config: config.integrations_config || null,
      super_prompt: config.super_prompt || null,
      // Sheets URLs (columnas individuales para n8n - GET y POST separados)
      sheets_database_url_get: config.integrations_config?.sheets?.urlGet || null,
      sheets_database_url_post: config.integrations_config?.sheets?.urlPost || null,
      sheets_custom_1_url_get: config.integrations_config?.sheets?.customSheets?.[0]?.urlGet || null,
      sheets_custom_1_url_post: config.integrations_config?.sheets?.customSheets?.[0]?.urlPost || null,
      sheets_custom_2_url_get: config.integrations_config?.sheets?.customSheets?.[1]?.urlGet || null,
      sheets_custom_2_url_post: config.integrations_config?.sheets?.customSheets?.[1]?.urlPost || null,
      // Gmail (columna individual para n8n)
      gmail_sender_email: config.integrations_config?.gmail?.sender || null,
      payment_plan: config.payment_plan || null,
      payment_method: config.payment_method || null,
      payment_status: config.payment_status || null,
      google_connected: config.google_connected || false
    };

    try {
      if (existing && config.id) {
        const { data, error } = await supabase
          .from('myia_page_config')
          .update(fullUpdateData)
          .eq('id', config.id)
          .select()
          .single();

        if (error) {
          firstInsertError = error;
          throw error;
        }
        result = data;
      } else {
        const { data, error } = await supabase
          .from('myia_page_config')
          .insert({
            user_id: userId,
            ...fullUpdateData
          })
          .select()
          .single();

        if (error) {
          firstInsertError = error;
          throw error;
        }
        result = data;
      }
    } catch (error) {
      log('=== ERROR EN PRIMER INTENTO ===');
      log('Error message: ' + error.message);
      log('Error code: ' + error.code);
      log('Error details: ' + error.details);
      log('Intentando con columnas básicas...');

      if (existing && config.id) {
        const { data, error } = await supabase
          .from('myia_page_config')
          .update(basicUpdateData)
          .eq('id', config.id)
          .select()
          .single();

        if (error) {
          log('=== ERROR EN SEGUNDO INTENTO ===');
          log('Error: ' + JSON.stringify(error));
          throw error;
        }
        result = data;
      } else {
        const { data, error } = await supabase
          .from('myia_page_config')
          .insert({
            user_id: userId,
            ...basicUpdateData
          })
          .select()
          .single();

        if (error) {
          log('=== ERROR EN SEGUNDO INTENTO ===');
          log('Error: ' + JSON.stringify(error));
          throw error;
        }
        result = data;
      }
    }
    
    // ACTUALIZAR INTEGRACIONES POR SEPARADO (FUERA DEL TRY/CATCH PARA QUE SIEMPRE SE EJECUTE)
    if (result && result.id) {
      log('=== ACTUALIZANDO INTEGRACIONES POR SEPARADO ===');
      log('ID del registro: ' + result.id);
      log('Datos a actualizar: ' + JSON.stringify({
        integrations_config: config.integrations_config,
        payment_plan: config.payment_plan,
        payment_method: config.payment_method,
        google_connected: config.google_connected
      }));
      
      const { data: updateResult, error: updateError } = await supabase
        .from('myia_page_config')
        .update({
          integrations_config: config.integrations_config || null,
          payment_plan: config.payment_plan || null,
          payment_method: config.payment_method || null,
          google_connected: config.google_connected || false
        })
        .eq('id', result.id)
        .select()
        .single();
      
      log('Resultado del update: ' + JSON.stringify(updateResult));
      log('Error del update: ' + (updateError ? JSON.stringify(updateError) : 'null'));
      
      if (!updateError) {
        result = updateResult;
        log('Update exitoso');
      } else {
        log('=== UPDATE DE INTEGRACIONES FALLÓ ===');
        log('Error: ' + JSON.stringify(updateError));
      }
    }

    res.json({ 
      success: true, 
      data: result,
      update_error: updateError ? updateError.message : null
    });
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener todas las apps de un usuario
router.get('/user-apps/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('myia_page_config')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting user apps:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener configuración por ID
router.get('/config-by-id/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Headers anti-cache
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const { data, error } = await supabase
      .from('myia_page_config')
      .select('*')
      .eq('id', id)
      .limit(1);

    if (error) {
      console.error('Error getting config by id:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, error: 'Configuración no encontrada' });
    }

    // Devolver el primer elemento (en caso de múltiples)
    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error getting config by id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener configuración por slug
router.get('/config-by-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const { data, error } = await supabase
      .from('myia_page_config')
      .select('*')
      .eq('slug', slug)
      .limit(1);

    if (error) {
      console.error('Error getting config by slug:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, error: 'Página no encontrada' });
    }

    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error getting config by slug:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Editar página (solo para páginas ya pagadas)
router.post('/edit-page/:pageId', generalLimiter, async (req, res) => {
  try {
    const { pageId } = req.params;
    const updateData = req.body;

    console.log('=== EDITANDO PÁGINA ===');
    console.log('Page ID:', pageId);
    console.log('Update Data:', JSON.stringify(updateData, null, 2));

    // Verificar que la página existe y está pagada
    const { data: existingPage, error: checkError } = await supabase
      .from('myia_page_config')
      .select('id, payment_status')
      .eq('id', pageId)
      .single();

    if (checkError || !existingPage) {
      return res.status(404).json({
        success: false,
        error: 'Página no encontrada'
      });
    }

    if (existingPage.payment_status !== 'paid') {
      return res.status(403).json({
        success: false,
        error: 'Esta página no está pagada. Debes completar el pago antes de editar.'
      });
    }

    // Actualizar la configuración
    const { error: updateError } = await supabase
      .from('myia_page_config')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', pageId);

    if (updateError) {
      console.error('Error al actualizar página:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Error al actualizar página',
        details: updateError.message
      });
    }

    console.log('Página actualizada exitosamente');
    res.json({ success: true, message: 'Página actualizada exitosamente' });
  } catch (error) {
    console.error('Error editando página:', error);
    res.status(500).json({
      success: false,
      error: 'Error al editar página',
      details: error.message
    });
  }
});

// Marcar página como pagada manualmente (temporal hasta que el webhook funcione)
router.post('/mark-as-paid/:pageId', generalLimiter, async (req, res) => {
  try {
    const { pageId } = req.params;

    console.log('=== MARCANDO PÁGINA COMO PAGADA ===');
    console.log('Page ID:', pageId);

    // Si pageId es "temp", crear nueva página en lugar de actualizar
    if (pageId === 'temp') {
      console.log('Page ID es "temp", creando nueva página desde cero');
      
      const plan = req.body.plan || 'responde';
      const userId = req.body.userId || 'user';
      const billingType = req.body.billingType || 'monthly';
      
      const tempPageId = generateUUID();
      const planPrices = {
        responde: { monthly: 49000, annual: 40833, annualTotal: 490000, messagesLimit: 1000, minimumMonths: 3 },
        asiste: { monthly: 79000, annual: 65833, annualTotal: 790000, messagesLimit: 2500, minimumMonths: 3 },
        automatiza: { monthly: 125000, annual: 104167, annualTotal: 1250000, messagesLimit: 5000, minimumMonths: 6 },
        intelligence: { monthly: 190000, annual: 158333, annualTotal: 1900000, messagesLimit: 10000, minimumMonths: 12 }
      };
      const planPrice = planPrices[plan] || planPrices.responde;

      const { error: insertError } = await supabase
        .from('myia_page_config')
        .insert({
          id: tempPageId,
          user_id: userId,
          slug: `myia-${tempPageId}`,
          page_name: `MyIA ${plan} - Pendiente de configuración`,
          payment_status: 'paid',
          subscription_status: 'authorized',
          payment_plan: plan,
          billing_type: billingType,
          subscription_id: `temp-${Date.now()}`,
          is_active: true,
          messages_limit: planPrice.messagesLimit,
          minimum_months: planPrice.minimumMonths,
          payment_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error al crear página desde "temp":', insertError);
        return res.status(500).json({
          success: false,
          error: 'Error al crear página',
          details: insertError.message
        });
      }

      console.log('Página creada desde "temp" exitosamente:', tempPageId);
      res.json({ success: true, pageId: tempPageId, message: 'Página creada exitosamente' });
      return;
    }

    // Caso normal: actualizar página existente
    const { error: updateError } = await supabase
      .from('myia_page_config')
      .update({
        payment_status: 'paid',
        subscription_status: 'authorized',
        is_active: true,
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', pageId);

    if (updateError) {
      console.error('Error al marcar como pagada:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Error al marcar como pagada',
        details: updateError.message
      });
    }

    console.log('Página marcada como pagada exitosamente');
    res.json({ success: true, message: 'Página marcada como pagada exitosamente' });
  } catch (error) {
    console.error('Error marcando como pagada:', error);
    res.status(500).json({
      success: false,
      error: 'Error al marcar como pagada',
      details: error.message
    });
  }
});

// Crear página temporal después del pago (temporal hasta que el webhook funcione)
router.post('/mark-as-paid/temp', generalLimiter, async (req, res) => {
  try {
    const { plan, userId, billingType } = req.body;

    console.log('=== CREANDO PÁGINA TEMPORAL DESPUÉS DEL PAGO ===');
    console.log('Plan:', plan);
    console.log('User ID:', userId);
    console.log('Billing Type:', billingType);

    const tempPageId = `myia-${plan}-${Date.now()}`;
    const planPrices = {
      responde: { monthly: 49000, annual: 40833, annualTotal: 490000, messagesLimit: 1000, minimumMonths: 3 },
      asiste: { monthly: 79000, annual: 65833, annualTotal: 790000, messagesLimit: 2500, minimumMonths: 3 },
      automatiza: { monthly: 125000, annual: 104167, annualTotal: 1250000, messagesLimit: 5000, minimumMonths: 6 },
      intelligence: { monthly: 0, annual: 0, annualTotal: 0, messagesLimit: 0, minimumMonths: 12 }
    };
    const planPrice = planPrices[plan] || planPrices.responde;

    const { error: insertError } = await supabase
      .from('myia_page_config')
      .insert({
        id: tempPageId,
        user_id: userId,
        slug: `myia-${tempPageId}`,
        page_name: `MyIA ${plan} - Pendiente de configuración`,
        payment_status: 'paid',
        subscription_status: 'authorized',
        payment_plan: plan,
        billing_type: billingType,
        subscription_id: `temp-${Date.now()}`,
        is_active: true,
        messages_limit: planPrice.messagesLimit,
        minimum_months: planPrice.minimumMonths,
        payment_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error al crear página temporal:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Error al crear página temporal',
        details: insertError.message
      });
    }

    console.log('Página temporal creada exitosamente:', tempPageId);
    res.json({ success: true, pageId: tempPageId, message: 'Página creada exitosamente' });
  } catch (error) {
    console.error('Error creando página temporal:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear página temporal',
      details: error.message
    });
  }
});

// Verificar si un email es coworker permitido (Crysantem COWORKERS)
router.get('/check-coworker/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('Verificando si email es coworker:', email);

    const { data, error } = await supabase
      .from('myia_coworkers')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No encontrado - no es coworker
        return res.json({ success: true, is_coworker: false });
      }
      throw error;
    }

    res.json({ success: true, is_coworker: true, coworker: data });
  } catch (error) {
    console.error('Error checking coworker:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener estadísticas de una página
router.get('/stats/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    console.log('Obteniendo estadísticas para página:', pageId);

    // Obtener estadísticas agregadas
    const { data: stats, error: statsError } = await supabase
      .from('myia_page_stats')
      .select('*')
      .eq('page_id', pageId)
      .order('stats_date', { ascending: false })
      .limit(30);

    if (statsError) {
      console.error('Error al obtener estadísticas:', statsError);
      // Si no hay estadísticas, retornar datos vacíos
      return res.json({
        success: true,
        data: {
          total_messages: 0,
          unique_users: 0,
          total_tokens_used: 0,
          avg_response_time: 0,
          daily_stats: []
        }
      });
    }

    // Calcular totales
    const totalMessages = stats.reduce((sum, s) => sum + (s.total_messages || 0), 0);
    const totalUsers = stats.reduce((sum, s) => sum + (s.unique_users || 0), 0);
    const totalTokens = stats.reduce((sum, s) => sum + (s.total_tokens_used || 0), 0);
    const avgResponseTime = stats.length > 0
      ? stats.reduce((sum, s) => sum + (s.avg_response_time || 0), 0) / stats.length
      : 0;

    // Formatear datos para gráficos
    const dailyStats = stats.map(s => ({
      date: s.stats_date,
      messages: s.total_messages || 0,
      users: s.unique_users || 0,
      tokens: s.total_tokens_used || 0
    })).reverse(); // Ordenar cronológicamente

    res.json({
      success: true,
      data: {
        total_messages: totalMessages,
        unique_users: totalUsers,
        total_tokens_used: totalTokens,
        avg_response_time: avgResponseTime,
        daily_stats: dailyStats
      }
    });
  } catch (error) {
    console.error('Error getting page stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener límite de mensajes actual de una página
router.get('/message-limit/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    console.log('Obteniendo límite de mensajes para página:', pageId);

    // Obtener configuración de la página
    const { data: pageConfig, error: configError } = await supabase
      .from('myia_page_config')
      .select('messages_limit, messages_used_this_month, current_month, current_year, is_active, plan')
      .eq('id', pageId)
      .single();

    if (configError || !pageConfig) {
      console.error('Error al obtener configuración de página:', configError);
      return res.status(404).json({ success: false, error: 'Página no encontrada' });
    }

    // Verificar si es necesario resetear el contador
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let messagesUsed = pageConfig.messages_used_this_month || 0;

    if (pageConfig.current_month !== currentMonth || pageConfig.current_year !== currentYear) {
      console.log('Cambio de mes detectado - reseteando contador');
      await supabase
        .from('myia_page_config')
        .update({
          messages_used_this_month: 0,
          current_month: currentMonth,
          current_year: currentYear,
          last_message_count_reset: now.toISOString()
        })
        .eq('id', pageId);
      messagesUsed = 0;
    }

    const messageLimit = pageConfig.messages_limit || 0;
    const remaining = messageLimit > 0 ? Math.max(0, messageLimit - messagesUsed) : 'unlimited';

    res.json({
      success: true,
      data: {
        limit: messageLimit,
        used: messagesUsed,
        remaining: remaining,
        is_active: pageConfig.is_active,
        plan: pageConfig.plan,
        current_month: currentMonth,
        current_year: currentYear,
        percentage: messageLimit > 0 ? Math.round((messagesUsed / messageLimit) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error getting message limit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener límite de mensajes de un usuario (para verificación en el chat)
router.get('/user-message-limit/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Obteniendo límite de mensajes para usuario:', userId);

    // Obtener límites del usuario desde user_message_limits
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    const { data: userLimits, error: limitsError } = await supabase
      .from('user_message_limits')
      .select('*')
      .eq('email', userId)
      .single();

    if (limitsError || !userLimits) {
      console.log('Usuario no tiene límites configurados, creando registro con límite generoso');
      // Crear registro con límite generoso
      const { data: newLimits, error: createError } = await supabase
        .from('user_message_limits')
        .insert({
          email: userId,
          monthly_message_limit: 10000, // Límite generoso por defecto
          messages_used: 0,
          current_month: currentMonth,
          current_year: currentYear
        })
        .select()
        .single();

      if (createError) {
        console.error('Error al crear límites:', createError);
        return res.status(500).json({ success: false, error: 'Error al inicializar límites' });
      }

      return res.json({
        success: true,
        data: {
          limit: newLimits.monthly_message_limit,
          used: newLimits.messages_used,
          remaining: newLimits.monthly_message_limit - newLimits.messages_used,
          current_month: currentMonth,
          current_year: currentYear
        }
      });
    }

    // Verificar si es necesario resetear el contador
    let messagesUsed = userLimits.messages_used || 0;
    if (userLimits.current_month !== currentMonth || userLimits.current_year !== currentYear) {
      console.log('Cambio de mes detectado - reseteando contador');
      await supabase
        .from('user_message_limits')
        .update({
          messages_used: 0,
          current_month: currentMonth,
          current_year: currentYear
        })
        .eq('email', userId);
      messagesUsed = 0;
    }

    const messageLimit = userLimits.monthly_message_limit || 0;
    const remaining = messageLimit > 0 ? Math.max(0, messageLimit - messagesUsed) : 'unlimited';

    res.json({
      success: true,
      data: {
        limit: messageLimit,
        used: messagesUsed,
        remaining: remaining,
        current_month: currentMonth,
        current_year: currentYear
      }
    });
  } catch (error) {
    console.error('Error getting user message limit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Registrar mensaje (para estadísticas)
router.post('/log-message', async (req, res) => {
  try {
    const { pageId, messageType, messageText, tokensUsed, responseTime, userId, sessionId } = req.body;

    console.log('Registrando mensaje:', { pageId, messageType, tokensUsed });

    // Guardar log del mensaje
    const { error: logError } = await supabase
      .from('myia_message_logs')
      .insert({
        page_id: pageId,
        user_id: userId || null,
        message_type: messageType,
        message_text: messageText?.substring(0, 1000), // Limitar longitud
        tokens_used: tokensUsed || 0,
        response_time_ms: responseTime || null
      });

    if (logError) {
      console.error('Error al guardar log de mensaje:', logError);
    }

    // Actualizar o crear sesión de usuario
    if (sessionId) {
      const { data: existingSession } = await supabase
        .from('myia_user_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (existingSession) {
        await supabase
          .from('myia_user_sessions')
          .update({
            last_message_at: new Date().toISOString(),
            message_count: existingSession.message_count + 1
          })
          .eq('session_id', sessionId);
      } else {
        await supabase
          .from('myia_user_sessions')
          .insert({
            page_id: pageId,
            session_id: sessionId,
            first_message_at: new Date().toISOString(),
            last_message_at: new Date().toISOString(),
            message_count: 1,
            user_agent: req.headers['user-agent'] || null,
            referrer: req.headers['referer'] || null
          });
      }
    }

    // Actualizar estadísticas diarias
    const today = new Date().toISOString().split('T')[0];
    const { data: existingStats } = await supabase
      .from('myia_page_stats')
      .select('*')
      .eq('page_id', pageId)
      .eq('stats_date', today)
      .single();

    if (existingStats) {
      await supabase
        .from('myia_page_stats')
        .update({
          total_messages: existingStats.total_messages + 1,
          total_tokens_used: existingStats.total_tokens_used + (tokensUsed || 0)
        })
        .eq('id', existingStats.id);
    } else {
      await supabase
        .from('myia_page_stats')
        .insert({
          page_id: pageId,
          total_messages: 1,
          unique_users: 0,
          total_tokens_used: tokensUsed || 0,
          stats_date: today
        });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error logging message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Servir página HTML por slug (pública)
router.get('/render/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('Renderizando página con slug:', slug);

    const { data, error } = await supabase
      .from('myia_page_config')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error al buscar página:', error);
      return res.status(404).send('Página no encontrada o no está activa');
    }

    if (!data) {
      console.log('Página no encontrada para slug:', slug);
      return res.status(404).send('Página no encontrada o no está activa');
    }

    console.log('Configuración encontrada:', {
      business_name: data.business_name,
      slug: data.slug,
      is_active: data.is_active
    });

    const html = generatePageHTML(data);
    res.send(html);
  } catch (error) {
    console.error('Error rendering page:', error);
    res.status(500).send('Error al renderizar la página: ' + error.message);
  }
});

function generatePageHTML(config, webhookUrl) {
  const titleFont = config.title_font || config.font_family;
  const socialLinks = config.social_links || {};
  const socialLinksHTML = Object.entries(socialLinks).map(([network, url]) => {
    if (!url) return '';
    const icons = { facebook: 'FB', instagram: 'IG', linkedin: 'LI', twitter: 'TW' };
    return `<a href="${url}" target="_blank" style="color: white; text-decoration: none; margin: 0 10px; padding: 8px 16px; background: rgba(255,255,255,0.1); border-radius: 20px; font-size: 0.85rem;">${icons[network] || network}</a>`;
  }).join('');

  const getHeaderStyle = () => {
    const isLight = config.header_theme === 'light';
    const textColor = isLight ? '#1a1a1a' : 'white';
    const linkColor = isLight ? '#0066cc' : '#00ff8c';
    return `color: ${textColor};`;
  };

  const getBackground = () => {
    if (config.background_type === 'gradient' && config.background_gradient) {
      return `linear-gradient(135deg, ${config.background_color} 0%, ${config.background_gradient} 100%)`;
    }
    if (config.background_type === 'glow' && config.glow_color) {
      return `radial-gradient(ellipse at top right, ${config.glow_color}33 0%, transparent 50%), ${config.background_color}`;
    }
    return config.background_color || '#050505';
  };

  const getBorderRadius = () => {
    return `${config.border_radius || 12}px`;
  };

  const getChatStyle = () => {
    if (config.chat_box_design === 'classic') return `background: rgba(20, 20, 20, 0.95); color: #ffffff; border: 2px solid ${config.chat_box_color};`;
    if (config.chat_box_design === 'minimal') return `background: transparent; color: white; border: 1px solid rgba(255,255,255,0.3);`;
    if (config.chat_box_design === 'neon') return `background: ${config.chat_box_color}30; color: white; border: 1px solid ${config.chat_box_color}50; box-shadow: 0 0 15px ${config.chat_box_color}40;`;
    if (config.chat_box_design === 'glass') return `background: rgba(255,255,255,0.1); color: white; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);`;
    return `background: ${config.chat_box_color}20; color: white;`;
  };

  const getInputStyle = () => {
    if (config.chat_box_design === 'classic') return `background: rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.2); color: #1a1a1a;`;
    return `background: rgba(255,255,255,0.1); border: none; color: white;`;
  };

  const getPlaceholderStyle = () => {
    if (config.chat_box_design === 'classic') return `color: rgba(0,0,0,0.4);`;
    return `color: rgba(255,255,255,0.5);`;
  };

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: http:; connect-src 'self' https://cdn.jsdelivr.net;">
  <title>${config.business_name || 'Agente IA'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: ${getBackground()}; font-family: 'Inter', sans-serif; color: white; min-height: 100vh; }
    .container { min-height: 100vh; display: flex; flex-direction: column; padding: 40px; }
    .header { width: 100%; max-width: 800px; margin: 0 auto 40px; border-radius: 0; background: ${config.header_color || 'rgba(0,0,0,0.3)'}; display: flex; align-items: center; gap: 20px; padding: 20px; ${getHeaderStyle()} }
    .logo { width: 80px; height: 80px; object-fit: contain; border-radius: 8px; }
    h1 { font-family: ${titleFont}; font-size: ${config.header_title_size || '2rem'}; font-weight: 700; ${getHeaderStyle()} }
    .content { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; max-width: 800px; margin: 0 auto; }
    .chat-section { padding: 40px; background: rgba(0,0,0,0.1); border-radius: 12px; width: 100%; }
    .chat-wrapper { max-width: 600px; margin: 0 auto; width: 100%; }
    .chat { background: rgba(0,0,0,0.8); border-radius: ${getBorderRadius()}; overflow: hidden; ${getChatStyle()} box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
    .chat-header { padding: 20px; font-weight: 600; font-size: 1.1rem; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 12px; }
    .chat-status { width: 10px; height: 10px; background: #00ff8c; border-radius: 50%; }
    .chat-messages { padding: 20px; max-height: 400px; overflow-y: auto; min-height: 300px; }
    .chat-bubble { padding: 14px 18px; border-radius: ${getBorderRadius()}; margin-bottom: 16px; max-width: 85%; line-height: 1.5; }
    .chat-bubble.ai { background: ${config.chat_box_color}40; margin-right: auto; }
    .chat-bubble.user { background: rgba(255,255,255,0.1); margin-left: auto; }
    .chat-input { padding: 16px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 12px; }
    .chat-input input { flex: 1; padding: 12px 16px; ${getInputStyle()} border-radius: 20px; font-size: 0.95rem; }
    .chat-input input::placeholder { ${getPlaceholderStyle()} }
    .chat-input button { padding: 12px 20px; background: ${config.chat_box_color}; border: none; border-radius: 20px; color: black; font-weight: 600; cursor: pointer; }
    .chat-input button:hover { opacity: 0.9; }
    .footer { margin-top: 20px; padding: 20px; text-align: center; font-size: 0.85rem; color: rgba(255,255,255,0.5); border-top: 1px solid rgba(255,255,255,0.1); }
    .social-links { margin-top: 16px; display: flex; justify-content: center; gap: 8px; }

    /* Navbar styles */
    .navbar { position: fixed; top: 0; left: 0; right: 0; background: rgba(5, 5, 5, 0.9); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255, 255, 255, 0.1); z-index: 1000; padding: 15px 40px; }
    .navbar-content { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; }
    .navbar-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; color: white; font-weight: 600; }
    .navbar-logo-img { height: 30px; }
    .navbar-auth { position: relative; }
    .navbar-auth-btn { background: transparent; color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; padding: 8px 16px; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px; transition: all 0.3s ease; cursor: pointer; }
    .navbar-auth-btn:hover { color: white; border-color: rgba(255, 255, 255, 0.2); }
    .navbar-dropdown { position: absolute; top: 100%; right: 0; margin-top: 8px; background: rgba(16, 16, 16, 0.95); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 8px; min-width: 180px; opacity: 0; visibility: hidden; transform: translateY(-10px); transition: all 0.3s ease; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5); }
    .navbar-dropdown.active { opacity: 1; visibility: visible; transform: translateY(0); }
    .navbar-dropdown-item { display: block; width: 100%; text-align: left; padding: 8px 16px; color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; border-radius: 4px; transition: all 0.3s ease; background: none; border: none; cursor: pointer; }
    .navbar-dropdown-item:hover { background: rgba(0, 255, 140, 0.1); color: #00ff8c; }
    .navbar-dropdown-logout { color: #ff4444 !important; }
    .navbar-dropdown-logout:hover { background: rgba(255, 68, 68, 0.1) !important; color: #ff4444 !important; }

    /* Responsive */
    @media (max-width: 768px) {
      .navbar { padding: 12px 20px; }
      .navbar-content { max-width: 100%; }
      .navbar-logo-img { height: 24px; }
      .navbar-logo span { font-size: 0.9rem; }
      .container { padding: 20px; padding-top: 100px; }
      .header { padding: 16px; margin-bottom: 20px; }
      .logo { width: 60px; height: 60px; }
      h1 { font-size: 1.5rem; }
      .chat-section { padding: 20px; }
      .chat-wrapper { padding: 0; }
      .chat { border-radius: 8px; }
      .chat-messages { max-height: 300px; min-height: 200px; }
      .chat-bubble { padding: 12px 14px; font-size: 0.9rem; }
      .chat-input { padding: 12px; }
      .chat-input input { padding: 10px 14px; font-size: 0.9rem; }
      .chat-input button { padding: 10px 16px; font-size: 0.85rem; }
      .modal-content { padding: 20px; margin: 20px; }
      .modal-title { font-size: 1.2rem; }
    }

    @media (max-width: 480px) {
      .navbar { padding: 10px 16px; }
      .navbar-logo-img { height: 20px; }
      .container { padding: 16px; padding-top: 80px; }
      .header { padding: 12px; }
      .logo { width: 50px; height: 50px; }
      h1 { font-size: 1.2rem; }
      .chat-section { padding: 16px; }
      .chat-messages { max-height: 250px; min-height: 150px; }
      .chat-bubble { padding: 10px 12px; font-size: 0.85rem; }
      .footer { font-size: 0.75rem; }
      .chart-container { padding: 12px; }
      .plan-card { padding: 16px; }
      .info-box { padding: 12px; }
    }

    /* Modal styles */
    .modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.8); align-items: center; justify-content: center; padding: 20px; z-index: 2000; }
    .modal.active { display: flex; }
    .modal-content { background: rgba(16, 16, 16, 0.95); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 32px; max-width: 450px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .modal-title { font-size: 1.5rem; font-weight: 700; color: white; }
    .modal-close { background: none; color: rgba(255, 255, 255, 0.5); font-size: 1.5rem; padding: 8px; transition: color 0.3s ease; border: none; cursor: pointer; }
    .modal-close:hover { color: #00ff8c; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 8px; color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; }
    .form-group input { width: 100%; padding: 12px 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white; font-size: 0.95rem; transition: all 0.3s ease; }
    .form-group input:focus { outline: none; border-color: #00ff8c; background: rgba(255, 255, 255, 0.1); }
    .form-group input::placeholder { color: rgba(255, 255, 255, 0.3); }
    .form-error { color: #ff4444; font-size: 0.85rem; margin-top: 4px; display: none; }
    .btn { padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; font-size: 0.95rem; }
    .btn-primary { background: #00ff8c; color: black; }
    .btn-primary:hover { background: #00e67a; transform: translateY(-1px); }
    .btn-full { width: 100%; }
    .auth-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
    .auth-tab { flex: 1; padding: 10px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: rgba(255, 255, 255, 0.7); cursor: pointer; transition: all 0.3s ease; font-size: 0.85rem; }
    .auth-tab.active { background: rgba(0, 255, 140, 0.1); border-color: #00ff8c; color: #00ff8c; }
    .auth-tab-content { display: none; }
    .auth-tab-content:first-child { display: block; }

    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }

    /* Markdown Components Styles */
    .plan-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      margin: 16px 0;
    }
    .plan-card.plan-highlight {
      border-color: #00ff88;
      background: rgba(0, 255, 136, 0.1);
    }
    .plan-header {
      margin-bottom: 16px;
    }
    .plan-name {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .plan-price {
      font-size: 1.5rem;
      font-weight: 700;
      color: #00ff8c;
    }
    .plan-features {
      list-style: none;
      padding: 0;
    }
    .plan-features li {
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .plan-features li:last-child {
      border-bottom: none;
    }

    .chart-container {
      margin: 20px 0;
      padding: 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .info-box {
      padding: 16px;
      border-radius: 8px;
      margin: 16px 0;
      border-left: 4px solid;
    }
    .info-box.info {
      background: rgba(72, 202, 228, 0.1);
      border-color: #48cae4;
    }
    .info-box.success {
      background: rgba(0, 255, 136, 0.1);
      border-color: #00ff8c;
    }
    .info-box.warning {
      background: rgba(255, 165, 0, 0.1);
      border-color: #ffa500;
    }
    .info-box.error {
      background: rgba(255, 68, 68, 0.1);
      border-color: #ff4444;
    }
    .info-box.tip {
      background: rgba(157, 78, 221, 0.1);
      border-color: #9d4edd;
    }

    .whatsapp-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: #25D366;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 16px 0;
      transition: transform 0.2s;
    }
    .whatsapp-btn:hover {
      transform: translateY(-2px);
    }

    .markdown-image {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 16px 0;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .chat-bubble h1,
    .chat-bubble h2,
    .chat-bubble h3 {
      margin-top: 16px;
      margin-bottom: 8px;
    }
    .chat-bubble h1 { font-size: 1.5rem; }
    .chat-bubble h2 { font-size: 1.3rem; }
    .chat-bubble h3 { font-size: 1.1rem; }
    .chat-bubble p { margin-bottom: 8px; }
    .chat-bubble ul, .chat-bubble ol { margin: 8px 0; padding-left: 20px; }
    .chat-bubble li { margin-bottom: 4px; }
    .chat-bubble code {
      background: rgba(255, 255, 255, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }
    .chat-bubble a { color: #00ff8c; text-decoration: underline; }
  </style>
</head>
<body>
  <nav class="navbar">
    <div class="navbar-content">
      <a href="/" class="navbar-logo">
        <img src="/images/New_Logo_White.png" alt="Crysantem" class="navbar-logo-img">
        <span>CRYSANTEM</span>
      </a>
      <div class="navbar-auth">
        <button id="authBtn" class="navbar-auth-btn">Account</button>
        <div id="authDropdown" class="navbar-dropdown">
          <button id="logoutBtn" class="navbar-dropdown-item navbar-dropdown-logout">Cerrar sesión</button>
        </div>
      </div>
    </div>
  </nav>

  <div class="container" style="padding-top: 100px;">
    <div class="header">
      ${config.logo_url ? `<img src="${config.logo_url}" class="logo">` : ''}
      <h1>${config.business_name || 'Mi Negocio'}</h1>
    </div>

    <div class="content"></div>

    <div class="chat-section">
      <div class="chat-wrapper">
        <div class="chat">
          <div class="chat-header"><div class="chat-status"></div><span>Asistente Virtual</span></div>
          <div class="chat-messages"><div class="chat-bubble ai">${config.welcome_message || 'Hola, ¿en qué puedo ayudarte?'}</div></div>
          <div class="chat-input"><input type="text" placeholder="Escribe tu mensaje..."><button>Enviar</button></div>
        </div>
      </div>
    </div>

    ${config.show_footer !== false ? `
    <div class="footer">
      Powered by Crysantem Intelligence
      ${socialLinksHTML ? `<div class="social-links">${socialLinksHTML}</div>` : ''}
    </div>
    ` : ''}
  </div>

  <div id="authModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Iniciar Sesión</h3>
        <button class="modal-close">×</button>
      </div>
      <form id="authForm"></form>
    </div>
  </div>

  <script src="/js/myia-auth.js?v=1.4"></script>
  <script>
    // Markdown Renderer - Simplificado para páginas MyIA
    class MarkdownRenderer {
      constructor() {
        this.chartCounter = 0;
      }

      render(markdown) {
        if (!markdown) return '';
        let html = markdown;
        html = this.processPlanComponents(html);
        html = this.processChartComponents(html);
        html = this.processNewChartComponents(html);
        html = this.processColorBoxes(html);
        html = this.processButtons(html);
        html = this.processLinks(html);
        html = this.processInfoComponents(html);
        html = this.processWhatsAppComponents(html);
        html = this.processMarkdownImages(html);
        html = this.processStandardMarkdown(html);
        return html;
      }

      processPlanComponents(text) {
        const planRegex = /\[PLAN\s+name="([^"]+)"\s+price="([^"]+)"(?:\s+highlight=(true|false))?\]([\s\S]*?)\[\/PLAN\]/g;
        return text.replace(planRegex, (match, name, price, highlight, features) => {
          const isHighlighted = highlight === 'true';
          const featureList = features.trim().split('\n').map(f => f.replace(/^-\s*/, '').trim()).filter(f => f);
          return \`
            <div class="plan-card \${isHighlighted ? 'plan-highlight' : ''}">
              <div class="plan-header">
                <h3 class="plan-name">\${name}</h3>
                <div class="plan-price">\${price}</div>
              </div>
              <ul class="plan-features">
                \${featureList.map(f => \`<li>\${f}</li>\`).join('')}
              </ul>
            </div>
          \`;
        });
      }

      processChartComponents(text) {
        const chartRegex = /\[CHART\s+type="(\w+)"(?:\s+id="([^"]+)")?\]([\s\S]*?)\[\/CHART\]/g;
        return text.replace(chartRegex, (match, type, customId, jsonData) => {
          const sanitizedId = customId ? customId.replace(/\\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '') : \`chart-\${this.chartCounter++}\`;
          try {
            const data = JSON.parse(jsonData.trim());
            if (!window.pendingCharts) window.pendingCharts = [];
            window.pendingCharts.push({ id: sanitizedId, type, data });
            return \`<div class="chart-container"><canvas id="\${sanitizedId}"></canvas></div>\`;
          } catch (e) {
            return \`<div class="error-box">Error al procesar el gráfico</div>\`;
          }
        });
      }

      processNewChartComponents(text) {
        const chartRegex = /:::grafico-(\\w+)\\n((?::::[a-z]+\\s+[^\\n]+\\n)*):::/g;
        return text.replace(chartRegex, (match, chartType, paramsBlock) => {
          const chartId = \`chart-\${this.chartCounter++}\`;
          const params = {};
          const paramLines = paramsBlock.trim().split('\\n');

          for (const line of paramLines) {
            const match = line.match(/^:::([a-z]+)\\s+(.+)$/);
            if (match) {
              const key = match[1];
              const value = match[2].trim();

              if (key === 'datos') {
                try {
                  params.data = JSON.parse(value);
                } catch (e) {
                  params.data = {};
                }
              } else if (key === 'etiqueta') {
                if (!params.labels) params.labels = [];
                params.labels.push(value);
              } else {
                params[key] = value;
              }
            }
          }

          const typeMap = { 'line': 'line', 'bar': 'bar', 'pie': 'pie', 'doughnut': 'doughnut', 'area': 'line' };
          const chartJsType = typeMap[chartType] || 'line';

          const colorMap = {
            'morado': { border: '#9b59b6', bg: 'rgba(155, 89, 182, 0.2)' },
            'verde': { border: '#2ecc71', bg: 'rgba(46, 204, 113, 0.2)' },
            'azul': { border: '#3498db', bg: 'rgba(52, 152, 219, 0.2)' },
            'rojo': { border: '#e74c3c', bg: 'rgba(231, 76, 60, 0.2)' },
            'naranja': { border: '#f39c12', bg: 'rgba(243, 156, 18, 0.2)' },
            'amarillo': { border: '#f1c40f', bg: 'rgba(241, 196, 15, 0.2)' },
            'cyan': { border: '#00bcd4', bg: 'rgba(0, 188, 212, 0.2)' },
            'rosa': { border: '#e91e63', bg: 'rgba(233, 30, 99, 0.2)' },
            'gris': { border: '#95a5a6', bg: 'rgba(149, 165, 166, 0.2)' }
          };

          const colors = colorMap[params.color] || colorMap['morado'];
          const labels = Object.keys(params.data || {});
          const values = Object.values(params.data || {});

          const chartData = {
            labels: labels,
            datasets: [{
              label: params.titulo || 'Gráfico',
              data: values,
              borderColor: colors.border,
              backgroundColor: colors.bg,
              borderWidth: 2,
              fill: chartJsType === 'line',
              tension: 0.4
            }]
          };

          const chartOptions = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              title: {
                display: !!params.titulo,
                text: params.titulo || '',
                color: '#fff'
              },
              legend: {
                labels: { color: '#fff' }
              }
            },
            scales: chartJsType === 'line' || chartJsType === 'bar' ? {
              x: {
                display: true,
                title: {
                  display: !!params.labels?.[0],
                  text: params.labels?.[0] || '',
                  color: '#fff'
                },
                ticks: { color: '#fff' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
              },
              y: {
                display: true,
                title: {
                  display: !!params.labels?.[1],
                  text: params.labels?.[1] || '',
                  color: '#fff'
                },
                ticks: { color: '#fff' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
              }
            } : {}
          };

          if (!window.pendingCharts) window.pendingCharts = [];
          window.pendingCharts.push({
            id: chartId,
            type: chartJsType,
            data: chartData,
            options: chartOptions
          });

          return \`<div class="chart-container" style="margin: 20px 0;"><canvas id="\${chartId}"></canvas></div>\`;
        });
      }

      processColorBoxes(text) {
        const boxRegex = /:::caja-(\\w+)\\n([\\s\\S]*?)\\n(?=:::|$)/g;
        const colorMap = {
          'morado': { bg: 'rgba(155, 89, 182, 0.2)', border: '#9b59b6' },
          'verde': { bg: 'rgba(46, 204, 113, 0.2)', border: '#2ecc71' },
          'azul': { bg: 'rgba(52, 152, 219, 0.2)', border: '#3498db' },
          'rojo': { bg: 'rgba(231, 76, 60, 0.2)', border: '#e74c3c' },
          'naranja': { bg: 'rgba(243, 156, 18, 0.2)', border: '#f39c12' },
          'amarillo': { bg: 'rgba(241, 196, 15, 0.2)', border: '#f1c40f' },
          'gris': { bg: 'rgba(149, 165, 166, 0.2)', border: '#95a5a6' }
        };

        return text.replace(boxRegex, (match, color, content) => {
          const colors = colorMap[color] || colorMap['azul'];
          return \`
            <div class="color-box" style="
              background: \${colors.bg};
              border-left: 4px solid \${colors.border};
              padding: 16px;
              margin: 12px 0;
              border-radius: 4px;
            ">
              \${content.trim()}
            </div>
          \`;
        });
      }

      processButtons(text) {
        const buttonRegex = /:::boton\\s+([^\\s]+)\\s+(https?:\\/\\/[^\\s]+|wa\\.me\\/[^\\s]+|mailto:[^\\s]+|tel:[^\\s]+)/g;
        return text.replace(buttonRegex, (match, text, action) => {
          let href = action;
          let bgColor = '#00ff88';
          let textColor = '#000';

          if (action.startsWith('wa.me') || action.startsWith('https://wa.me')) {
            bgColor = '#25D366';
            textColor = '#fff';
            if (!action.startsWith('https://')) {
              href = \`https://\${action}\`;
            }
          } else if (action.startsWith('mailto:')) {
            bgColor = '#3498db';
            textColor = '#fff';
          } else if (action.startsWith('tel:')) {
            bgColor = '#2ecc71';
            textColor = '#fff';
          } else if (action.startsWith('http')) {
            bgColor = '#00ff88';
            textColor = '#000';
          }

          return \`
            <a href="\${href}" target="_blank" class="action-button" style="
              display: inline-block;
              background: \${bgColor};
              color: \${textColor};
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              margin: 8px 4px;
              font-weight: 600;
            ">
              \${text}
            </a>
          \`;
        });
      }

      processLinks(text) {
        const linkRegex = /:::enlace\\s+([^\\s]+)\\s+(https?:[^\\s]+)/g;
        return text.replace(linkRegex, (match, text, url) => {
          return \`
            <a href="\${url}" target="_blank" class="action-link" style="
              display: inline-block;
              background: rgba(255, 255, 255, 0.1);
              color: #00ff88;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              margin: 8px 4px;
              border: 1px solid #00ff88;
            ">
              \${text}
            </a>
          \`;
        });
      }

      processInfoComponents(text) {
        const infoRegex = /\[INFO\s+type="(info|success|warning|error|tip)"\]([\s\S]*?)\[\/INFO\]/g;
        return text.replace(infoRegex, (match, type, content) => {
          return \`<div class="info-box \${type}">\${content.trim()}</div>\`;
        });
      }

      processWhatsAppComponents(text) {
        const whatsappRegex = /\[WHATSAPP\s+phone="([^"]+)"(?:\s+message="([^"]*)")?\/\]/g;
        return text.replace(whatsappRegex, (match, phone, message) => {
          const msg = message ? encodeURIComponent(message) : '';
          return \`<a href="https://wa.me/\${phone}\${msg ? '?text=' + msg : ''}" target="_blank" class="whatsapp-btn">WhatsApp</a>\`;
        });
      }

      processMarkdownImages(text) {
        const imageRegex = /!\\[([^\\]]*)\\]\\(markdown:([^)]+)\\)/g;
        return text.replace(imageRegex, (match, alt, filename) => {
          return \`<img src="/IMG/imagenes_markdown/\${filename}" alt="\${alt}" class="markdown-image">\`;
        });
      }

      processStandardMarkdown(text) {
        // Headers
        text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        // Bold
        text = text.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
        // Italic
        text = text.replace(/\\*(.+?)\\*/g, '<em>$1</em>');
        // Strikethrough
        text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');
        // Code
        text = text.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
        // Links
        text = text.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" target="_blank">$1</a>');
        // Line breaks
        text = text.replace(/\\n/g, '<br>');
        return text;
      }
    }

    const markdownRenderer = new MarkdownRenderer();

    // Inicializar gráficos pendientes
    function initCharts() {
      if (window.pendingCharts && window.pendingCharts.length > 0) {
        window.pendingCharts.forEach(chart => {
          try {
            const ctx = document.getElementById(chart.id);
            if (ctx && window.Chart) {
              new Chart(ctx, {
                type: chart.type,
                data: chart.data,
                options: {
                  responsive: true,
                  plugins: {
                    legend: {
                      labels: { color: 'white' }
                    }
                  },
                  scales: {
                    y: {
                      ticks: { color: 'white' },
                      grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    x: {
                      ticks: { color: 'white' },
                      grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                  }
                }
              });
            }
          } catch (e) {
            console.error('Error inicializando gráfico:', chart.id, e);
          }
        });
        window.pendingCharts = [];
      }
    }

    // MutationObserver para detectar nuevos mensajes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.classList && node.classList.contains('chat-bubble') && node.classList.contains('ai')) {
            const text = node.textContent;
            node.innerHTML = markdownRenderer.render(text);
            setTimeout(initCharts, 100);
          }
        });
      });
    });

    observer.observe(document.querySelector('.chat-messages'), {
      childList: true,
      subtree: true
    });
  </script>
  <script>
    const chatInput = document.querySelector('.chat-input input');
    const chatButton = document.querySelector('.chat-input button');
    const chatMessages = document.querySelector('.chat-messages');

    // Datos seguros (sin webhooks expuestos)
    const pageId = '${config.id}';
    const userId = '${config.user_id}';
    const plan = '${config.plan}';

    console.log('Page ID:', pageId);
    console.log('User ID:', userId);
    console.log('Plan:', plan);

    if (chatInput && chatButton) {
      chatInput.disabled = false;
      chatButton.disabled = false;

      chatButton.addEventListener('click', sendMessage);
      chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

      async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage(message, 'user');
        chatInput.value = '';
        chatInput.disabled = true;
        chatButton.disabled = true;

        try {
          // Enviar al proxy del backend (seguro - webhooks solo en backend)
          const response = await fetch('/api/myia/chat-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message,
              pageId,
              userId,
              plan
            })
          });

          const data = await response.json();

          if (response.ok && data.success && data.response) {
            addMessage(data.response, 'ai');
          } else if (data.code === 'BOT_SUSPENDED') {
            addMessage('⚠️ ' + data.error, 'ai');
            // Deshabilitar el chat
            chatInput.disabled = true;
            chatButton.disabled = true;
            chatInput.placeholder = 'Bot suspendido - Contacta al soporte';
          } else if (data.code === 'MESSAGE_LIMIT_REACHED') {
            addMessage('⚠️ ' + data.error, 'ai');
            // Deshabilitar el chat
            chatInput.disabled = true;
            chatButton.disabled = true;
            chatInput.placeholder = 'Límite alcanzado - Renueva el próximo mes';
          } else {
            addMessage('Lo siento, hubo un error al procesar tu mensaje. Por favor intenta nuevamente.', 'ai');
          }
        } catch (error) {
          console.error('Error sending message:', error);
          addMessage('Lo siento, no pudimos conectar con el servicio. Por favor intenta nuevamente.', 'ai');
        } finally {
          chatInput.disabled = false;
          chatButton.disabled = false;
          chatInput.focus();
        }
      }

      function addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-bubble';
        messageDiv.classList.add(type);
        messageDiv.innerHTML = type === 'ai' ? marked.parse(text) : text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }
  </script>
</body>
</html>`;
}

// Endpoint para ver logs (solo para debugging)
router.get('/debug-logs', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const logFile = path.join(__dirname, '../debug-config.log');
  
  try {
    const logs = fs.readFileSync(logFile, 'utf8');
    res.json({ success: true, logs });
  } catch (error) {
    res.json({ success: true, logs: 'No hay logs aún' });
  }
});

// Endpoint simple para verificar que myia router funciona
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'MyIA router funciona' });
});

// === MERCADO PAGO ENDPOINTS ===

// Crear suscripción dinámica (con cobro inicial + mensual)
router.post('/create-subscription', generalLimiter, async (req, res) => {
  try {
    console.log('=== REQUEST RECIBIDO ===');
    console.log('Body completo:', JSON.stringify(req.body, null, 2));

    const { plan, pageId, userId, clickId, payerEmail: incomingPayerEmail, billingType = 'monthly' } = req.body;

    console.log('=== CREANDO SUSCRIPCIÓN MERCADO PAGO ===');
    console.log('Plan:', plan);
    console.log('Page ID:', pageId);
    console.log('User ID:', userId);
    console.log('Payer Email:', incomingPayerEmail);
    console.log('Click ID (Tapfiliate):', clickId);
    console.log('Billing Type:', billingType);
    console.log('MP_ACCESS_TOKEN configurado:', !!process.env.MP_ACCESS_TOKEN);
    console.log('APP_URL:', process.env.APP_URL);

    // Precios de planes (en pesos argentinos) - NUEVO MODELO SaaS MRR
    const PLAN_PRICES = {
      responde: {
        monthly: 49000,
        annual: 40833,
        annualTotal: 490000,
        title: '01 - Responde',
        messagesLimit: 1000,
        minimumMonths: 3
      },
      asiste: {
        monthly: 79000,
        annual: 65833,
        annualTotal: 790000,
        title: '02 - Asiste',
        messagesLimit: 2500,
        minimumMonths: 3
      },
      automatiza: {
        monthly: 125000,
        annual: 104167,
        annualTotal: 1250000,
        title: '03 - Automatiza',
        messagesLimit: 5000,
        minimumMonths: 6
      },
      intelligence: {
        monthly: 190000,
        annual: 158333,
        annualTotal: 1900000,
        title: '04 - Intelligence',
        messagesLimit: 10000,
        minimumMonths: 12
      }
    };

    const planPrice = PLAN_PRICES[plan];
    if (!planPrice) {
      return res.status(400).json({ success: false, error: 'Plan inválido' });
    }

    // Ya no tratamos intelligence como custom - usa precios normales

    if (!incomingPayerEmail) {
      return res.status(400).json({ success: false, error: 'Email del pagador es requerido para suscripciones' });
    }

    // Usar el email real del pagador (modo producción)
    const payerEmail = incomingPayerEmail;

    // Calcular fecha de inicio y fin según tipo de facturación
    const startDate = new Date();
    const endDate = new Date();

    if (billingType === 'annual') {
      // Para anual: cobro único de 12 meses con descuento
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      // Para mensual: renovación automática por 1 año
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Determinar precio y frecuencia según tipo de facturación
    let transactionAmount, frequency, frequencyType, subscriptionReason;

    if (billingType === 'annual') {
      // Para anual: cobro mensual con descuento durante 12 meses (mejor para MRR)
      transactionAmount = planPrice.annual; // Precio mensual con descuento
      frequency = 1;
      frequencyType = 'months';
      subscriptionReason = `MyIA ${plan} - Anual`; // Corto para MP (max 60 chars)
    } else {
      // Para mensual: cobro mensual recurrente
      transactionAmount = planPrice.monthly;
      frequency = 1;
      frequencyType = 'months';
      subscriptionReason = `MyIA ${plan} - Mensual`; // Corto para MP (max 60 chars)
    }

    // Crear suscripción sin plan asociado (status: pending para que el usuario pague en checkout)
    const subscriptionData = {
      reason: subscriptionReason,
      external_reference: pageId || `plan_${plan}_${Date.now()}`,
      payer_email: payerEmail,
      auto_recurring: {
        frequency: frequency,
        frequency_type: frequencyType,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        transaction_amount: transactionAmount,
        currency_id: 'ARS'
      },
      back_url: `${process.env.APP_URL}/myia-payment-success.html`,
      status: 'pending', // Usuario pagará en checkout
      metadata: {
        plan: plan,
        pageId: pageId,
        userId: userId,
        clickId: clickId || null, // Click ID de Tapfiliate
        billing_type: billingType,
        monthly_price: planPrice.monthly,
        annual_price: planPrice.annual,
        annual_total: planPrice.annualTotal,
        messages_limit: planPrice.messagesLimit,
        minimum_months: planPrice.minimumMonths,
        is_subscription: true
      }
    };

    // Crear suscripción usando la API directamente (más control que el SDK)
    const response = await axios.post(
      'https://api.mercadopago.com/preapproval',
      subscriptionData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Suscripción creada exitosamente');
    console.log('Subscription ID:', response.data.id);
    console.log('Init Point:', response.data.init_point);

    res.json({
      success: true,
      subscriptionId: response.data.id,
      initPoint: response.data.init_point,
      sandboxInitPoint: response.data.sandbox_init_point,
      billingType: billingType
    });
  } catch (error) {
    console.error('Error al crear suscripción:', error);
    console.error('Detalle:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Error al crear suscripción',
      details: error.response?.data || error.message
    });
  }
});

// Crear preferencia de pago (mantener como fallback para pago único sin suscripción)
router.post('/create-payment-preference', generalLimiter, async (req, res) => {
  try {
    const { plan, pageId, userId, clickId, billingType = 'monthly' } = req.body;

    console.log('=== CREANDO PREFERENCIA DE PAGO ===');
    console.log('Plan:', plan);
    console.log('Page ID:', pageId);
    console.log('User ID:', userId);
    console.log('Click ID (Tapfiliate):', clickId);
    console.log('Billing Type:', billingType);

    // Precios de planes (en pesos argentinos) - NUEVO MODELO SaaS MRR
    const PLAN_PRICES = {
      responde: {
        monthly: 49000,
        annual: 40833,
        annualTotal: 490000,
        title: '01 - Responde',
        messagesLimit: 1000,
        minimumMonths: 3
      },
      asiste: {
        monthly: 79000,
        annual: 65833,
        annualTotal: 790000,
        title: '02 - Asiste',
        messagesLimit: 2500,
        minimumMonths: 3
      },
      automatiza: {
        monthly: 125000,
        annual: 104167,
        annualTotal: 1250000,
        title: '03 - Automatiza',
        messagesLimit: 5000,
        minimumMonths: 6
      },
      intelligence: {
        monthly: 0, // Custom/Personalizado
        annual: 0, // Custom/Personalizado
        annualTotal: 0, // Custom/Personalizado
        title: '04 - Enterprise',
        messagesLimit: 0,
        minimumMonths: 12
      }
    };

    const planPrice = PLAN_PRICES[plan];
    if (!planPrice) {
      return res.status(400).json({ success: false, error: 'Plan inválido' });
    }

    // Determinar precio según tipo de facturación
    const unitPrice = billingType === 'annual' ? planPrice.annual : planPrice.monthly;
    const title = billingType === 'annual'
      ? `Suscripción Anual - ${planPrice.title} (12 cuotas de $${planPrice.annual.toLocaleString('es-AR')})`
      : `Suscripción Mensual - ${planPrice.title}`;

    // Crear preferencia de pago
    const preference = {
      items: [
        {
          id: `${plan}_${billingType}`,
          title: title,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: unitPrice
        }
      ],
      back_urls: {
        success: `${process.env.APP_URL}/myia-payment-success.html`,
        failure: `${process.env.APP_URL}/myia-payment-failure.html`,
        pending: `${process.env.APP_URL}/myia-payment-pending.html`
      },
      auto_return: 'approved',
      metadata: {
        plan: plan,
        pageId: pageId,
        userId: userId,
        clickId: clickId || null, // Click ID de Tapfiliate
        billing_type: billingType,
        monthly_price: planPrice.monthly,
        annual_price: planPrice.annual,
        annual_total: planPrice.annualTotal,
        messages_limit: planPrice.messagesLimit,
        minimum_months: planPrice.minimumMonths
      },
      external_reference: pageId || `plan_${plan}_${Date.now()}`,
      notification_url: `${process.env.APP_URL}/api/myia/mercadopago-webhook`
    };

    // Crear preferencia usando API directamente (sin SDK)
    const response = await axios.post(
      'https://api.mercadopago.com/checkout/preferences',
      preference,
      {
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Preferencia creada exitosamente');
    console.log('Init Point:', response.body.init_point);

    res.json({
      success: true,
      preferenceId: response.body.id,
      initPoint: response.body.init_point,
      sandboxInitPoint: response.body.sandbox_init_point,
      billingType: billingType
    });
  } catch (error) {
    console.error('Error al crear preferencia de pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear preferencia de pago',
      details: error.message
    });
  }
});

// Webhook de Mercado Pago (IPN)
router.post('/mercadopago-webhook', async (req, res) => {
  try {
    console.log('=== WEBHOOK DE MERCADO PAGO RECIBIDO ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));

    const { topic, resource, action } = req.body;

    // Procesar eventos de suscripción (preapproval)
    if (topic === 'preapproval') {
      console.log('=== PROCESANDO EVENTO DE SUSCRIPCIÓN ===');

      const preapprovalId = resource.split('/').pop();
      console.log('Preapproval ID:', preapprovalId);
      console.log('Action:', action);

      // Obtener detalles de la suscripción
      const subscriptionResponse = await axios.get(
        `https://api.mercadopago.com/preapproval/${preapprovalId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
          }
        }
      );

      const subscription = subscriptionResponse.data;
      console.log('Estado de suscripción:', subscription.status);

      // Extraer metadata
      const metadata = subscription.metadata || {};
      const { plan, pageId, userId, clickId, billing_type, monthly_price, annual_price, annual_total, messages_limit, minimum_months } = metadata;

      console.log('=== METADATA DE SUSCRIPCIÓN ===');
      console.log('Plan:', plan);
      console.log('Page ID:', pageId);
      console.log('User ID:', userId);
      console.log('Click ID (Tapfiliate):', clickId);
      console.log('Billing Type:', billing_type);
      console.log('Messages Limit:', messages_limit);
      console.log('Minimum Months:', minimum_months);

      // Actualizar estado en Supabase según el estado de la suscripción
      if (pageId) {
        // Primero verificar si la página existe
        const { data: existingPage, error: checkError } = await supabase
          .from('myia_page_config')
          .select('id')
          .eq('id', pageId)
          .single();

        let updateData = {
          subscription_id: subscription.id,
          subscription_status: subscription.status,
          payment_plan: plan,
          billing_type: billing_type || 'monthly',
          messages_limit: messages_limit || 0,
          minimum_months: minimum_months || 3
        };

        // Si la suscripción está autorizada, marcar como pagado
        if (subscription.status === 'authorized') {
          updateData.payment_status = 'paid';
          updateData.payment_date = new Date().toISOString();
          updateData.is_active = true;
          console.log('Suscripción autorizada - Bot activo');
        }
        // Si la suscripción está pendiente de pago, marcar como unpaid
        else if (subscription.status === 'pending_payment' || subscription.status === 'paused') {
          updateData.payment_status = 'unpaid';
          updateData.is_active = false;
          console.log('Suscripción pendiente de pago - Bot suspendido');
        }
        // Si la suscripción fue cancelada
        else if (subscription.status === 'cancelled') {
          updateData.payment_status = 'cancelled';
          updateData.is_active = false;
          console.log('Suscripción cancelada - Bot desactivado');
        }

        // Si la página no existe, crearla con los datos disponibles
        if (checkError || !existingPage) {
          console.log('Página no existe, creando desde metadata de suscripción');
          const insertData = {
            id: pageId,
            user_id: userId,
            ...updateData,
            slug: `myia-${pageId}`, // Slug temporal
            page_name: `MyIA Page ${plan}`, // Nombre temporal
            created_at: new Date().toISOString()
          };

          const { error: insertError } = await supabase
            .from('myia_page_config')
            .insert(insertData);

          if (insertError) {
            console.error('Error al crear página desde suscripción:', insertError);
          } else {
            console.log('Página creada desde suscripción - Pagada y lista para editar');
          }
        } else {
          // Si la página existe, solo actualizar el estado
          const { error: updateError } = await supabase
            .from('myia_page_config')
            .update(updateData)
            .eq('id', pageId);

          if (updateError) {
            console.error('Error al actualizar estado de suscripción:', updateError);
          } else {
            console.log('Estado de suscripción actualizado en Supabase');
          }
        }
      }

      // Registrar comisión en Tapfiliate (solo una vez, cuando se autoriza la suscripción)
      if (clickId && process.env.TAPFILIATE_API_KEY && action === 'created' && subscription.status === 'authorized') {
        console.log('=== REGISTRANDO COMISIÓN EN TAPFILIATE (SUSCRIPCIÓN) ===');

        const commissionAmount = billing_type === 'annual' ? annual_total : monthly_price;

        try {
          const tapfiliateResponse = await axios.post(
            'https://api.tapfiliate.com/1.6/commissions/',
            {
              click_id: clickId,
              external_id: subscription.id.toString(),
              amount: commissionAmount || 0,
              currency: 'ARS'
            },
            {
              headers: {
                'X-Api-Key': process.env.TAPFILIATE_API_KEY,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('Comisión registrada exitosamente en Tapfiliate');
          console.log('Respuesta:', JSON.stringify(tapfiliateResponse.data, null, 2));
        } catch (tapfiliateError) {
          console.error('Error al registrar comisión en Tapfiliate:', tapfiliateError.response?.data || tapfiliateError.message);
        }
      }

      return res.status(200).json({ success: true, message: 'Webhook de suscripción procesado' });
    }

    // Procesar eventos de pago (payment)
    if (topic === 'payment') {
      console.log('=== PROCESANDO EVENTO DE PAGO ===');

      // Extraer payment ID del resource
      const paymentId = resource.split('/').pop();
      console.log('Payment ID:', paymentId);

      // Obtener detalles del pago desde Mercado Pago
      const payment = await mercadopago.payment.findById(paymentId);
      const paymentData = payment.body;

      console.log('Estado del pago:', paymentData.status);
      console.log('Estado aprobado:', paymentData.status === 'approved');

      // Solo procesar pagos aprobados
      if (paymentData.status !== 'approved') {
        console.log('Pago no aprobado, ignorando');
        return res.status(200).json({ success: true, message: 'Payment not approved' });
      }

      // Extraer metadata
      const metadata = paymentData.metadata || {};
      const { plan, pageId, userId, clickId, billing_type, monthly_price, annual_price, annual_total, messages_limit, minimum_months } = metadata;

      console.log('=== METADATA DEL PAGO ===');
      console.log('Plan:', plan);
      console.log('Page ID:', pageId);
      console.log('User ID:', userId);
      console.log('Click ID (Tapfiliate):', clickId);
      console.log('Billing Type:', billing_type);
      console.log('Messages Limit:', messages_limit);
      console.log('Minimum Months:', minimum_months);
      console.log('Monto total:', paymentData.transaction_amount);
      console.log('ID de transacción Mercado Pago:', paymentData.id);

      // Actualizar el estado de pago en Supabase
      if (pageId) {
        const { error: updateError } = await supabase
          .from('myia_page_config')
          .update({
            payment_status: 'paid',
            payment_id: paymentData.id,
            payment_date: new Date().toISOString(),
            payment_plan: plan,
            billing_type: billing_type || 'monthly',
            messages_limit: messages_limit || 0,
            minimum_months: minimum_months || 3,
            is_active: true
          })
          .eq('id', pageId);

        if (updateError) {
          console.error('Error al actualizar estado de pago:', updateError);
        } else {
          console.log('Estado de pago actualizado en Supabase');
        }
      }

      // === REGISTRAR COMISIÓN EN TAPFILIATE ===
      if (clickId && process.env.TAPFILIATE_API_KEY) {
        console.log('=== REGISTRANDO COMISIÓN EN TAPFILIATE ===');

        try {
          const tapfiliateResponse = await axios.post(
            'https://api.tapfiliate.com/1.6/commissions/',
            {
              click_id: clickId,
              external_id: paymentData.id.toString(),
              amount: paymentData.transaction_amount,
              currency: 'ARS'
            },
            {
              headers: {
                'X-Api-Key': process.env.TAPFILIATE_API_KEY,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('Comisión registrada exitosamente en Tapfiliate');
          console.log('Respuesta:', JSON.stringify(tapfiliateResponse.data, null, 2));
        } catch (tapfiliateError) {
          console.error('Error al registrar comisión en Tapfiliate:', tapfiliateError.response?.data || tapfiliateError.message);
        }
      } else {
        console.log('No hay click_id o API key de Tapfiliate, omitiendo registro de comisión');
      }

      return res.status(200).json({ success: true, message: 'Webhook de pago procesado' });
    }

    // Topic no reconocido
    console.log('Topic no reconocido:', topic);
    return res.status(200).json({ success: true, message: 'Topic not handled' });
  } catch (error) {
    console.error('Error al procesar webhook de Mercado Pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar webhook',
      details: error.message
    });
  }
});

// Verificar estado de pago de una página
router.get('/payment-status/:pageId', generalLimiter, async (req, res) => {
  try {
    const { pageId } = req.params;

    const { data, error } = await supabase
      .from('myia_page_config')
      .select('payment_status, payment_id, payment_date, payment_plan, payment_method')
      .eq('id', pageId)
      .single();

    if (error) {
      return res.status(404).json({ success: false, error: 'Página no encontrada' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error al verificar estado de pago:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// === PAULA IA CHAT PROXY ===
// Endpoint protegido que actúa como proxy para el webhook de n8n
router.post('/paula-chat', generalLimiter, async (req, res) => {
  try {
    const { message, sessionId, timestamp } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Mensaje es requerido' });
    }

    console.log('=== PAULA CHAT REQUEST ===');
    console.log('Session ID:', sessionId);
    console.log('Message:', message);
    console.log('Timestamp:', timestamp);

    // Webhook de n8n (URL oculta en backend)
    const PAULA_WEBHOOK_URL = 'https://n8n-n8n.f6ppdc.easypanel.host/webhook/agente-paula';

    // Llamar al webhook de n8n
    const response = await axios.post(PAULA_WEBHOOK_URL, {
      message,
      sessionId: sessionId || `paula_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: timestamp || new Date().toISOString()
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 segundos timeout
    });

    console.log('PAULA CHAT RESPONSE:', response.data);

    res.json({
      success: true,
      response: response.data.response || response.data.text || response.data,
      sessionId: sessionId
    });
  } catch (error) {
    console.error('Error en Paula Chat Proxy:', error);
    
    if (error.response) {
      console.error('Error response:', error.response.data);
      return res.status(error.response.status).json({
        success: false,
        error: 'Error al comunicar con Paula IA',
        details: error.response.data
      });
    }
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        error: 'Timeout: Paula IA no respondió a tiempo'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al procesar chat'
    });
  }
});

// === ENDPOINT PARA N8N: OBTENER TOKENS OAUTH DE GOOGLE POR USUARIO ===
// Este endpoint permite que n8n obtenga tokens OAuth frescos para cada usuario
// CRÍTICO: Este endpoint NUNCA debe responder HTML, solo JSON
router.post('/get-google-tokens', generalLimiter, async (req, res) => {
  // Forzar Content-Type JSON en todas las respuestas
  res.setHeader('Content-Type', 'application/json');

  try {
    const { userId } = req.body;

    console.log('=== N8N TOKEN REQUEST ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Body recibido:', JSON.stringify(req.body));
    console.log('User ID:', userId);

    // Validación estricta: userId debe existir y no estar vacío
    if (!userId || userId === '' || userId === null || userId === undefined) {
      console.error('ERROR: userId inválido o vacío');
      return res.status(400).json({
        success: false,
        error: 'userId es requerido y no puede estar vacío',
        code: 'INVALID_USER_ID'
      });
    }

    // Validar formato del userId (debe ser UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error('ERROR: userId no es un UUID válido:', userId);
      return res.status(400).json({
        success: false,
        error: 'userId debe ser un UUID válido',
        code: 'INVALID_USER_ID_FORMAT',
        received: userId
      });
    }

    console.log('Consultando tokens en Supabase para userId:', userId);

    // Obtener tokens de la tabla user_google_tokens
    // Usar order by updated_at desc y limit 1 para obtener el registro más reciente
    const { data: tokens, error: tokensError } = await supabase
      .from('user_google_tokens')
      .select('access_token, refresh_token, email, expires_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    console.log('Resultado de consulta:', { tokens, tokensError });

    // Manejo mejorado de errores de Supabase
    if (tokensError) {
      console.error('ERROR Supabase:', tokensError);
      if (tokensError.code === 'PGRST116') {
        // No se encontró registro
        console.error('No se encontraron tokens para userId:', userId);
        return res.status(404).json({
          success: false,
          error: 'Tokens de Google no encontrados para este usuario',
          code: 'TOKENS_NOT_FOUND',
          details: 'El usuario no ha conectado Google OAuth'
        });
      }
      // Otro error de Supabase
      console.error('Error de base de datos:', tokensError.message);
      return res.status(500).json({
        success: false,
        error: 'Error al consultar la base de datos',
        code: 'DATABASE_ERROR',
        details: tokensError.message
      });
    }

    if (!tokens) {
      console.error('ERROR: Tokens nulos para userId:', userId);
      return res.status(404).json({
        success: false,
        error: 'Tokens de Google no encontrados para este usuario',
        code: 'TOKENS_NOT_FOUND'
      });
    }

    console.log('Tokens encontrados para userId:', userId);
    console.log('Email:', tokens.email);
    console.log('Token expires at:', tokens.expires_at);

    // Verificar si el access_token está expirado o cerca de expiración
    const now = new Date();
    const expiresAt = new Date(tokens.expires_at);
    const isExpired = now >= expiresAt;
    const needsRefresh = (expiresAt - now) < 5 * 60 * 1000; // Refrescar si faltan menos de 5 minutos

    let accessToken = tokens.access_token;

    // Si necesita refresco, usar el refresh_token para obtener un nuevo access_token
    if (isExpired || needsRefresh) {
      console.log('Token expirado o cerca de expirar, refrescando...');
      console.log('Expira en:', Math.floor((expiresAt - now) / 1000 / 60), 'minutos');

      try {
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: tokens.refresh_token,
          grant_type: 'refresh_token'
        });

        accessToken = tokenResponse.data.access_token;
        const newExpiresAt = new Date(Date.now() + (tokenResponse.data.expires_in * 1000));

        console.log('Token refrescado exitosamente, nuevo expires_in:', tokenResponse.data.expires_in, 'segundos');

        // Actualizar tokens en Supabase
        await supabase
          .from('user_google_tokens')
          .update({
            access_token: accessToken,
            expires_at: newExpiresAt.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('user_id', userId);

        console.log('Tokens actualizados en Supabase');
      } catch (refreshError) {
        console.error('ERROR al refrescar token:', refreshError.message);
        // Si falla el refresco, continuar con el token existente (podría seguir funcionando)
        console.log('Continuando con token existente (puede estar expirado)');
      }
    }

    console.log('Enviando access_token a n8n para user:', userId);

    // Respuesta exitosa
    const response = {
      success: true,
      data: {
        access_token: accessToken,
        email: tokens.email,
        expires_at: tokens.expires_at
      }
    };

    console.log('Response structure:', {
      success: response.success,
      has_access_token: !!response.data.access_token,
      access_token_length: response.data.access_token?.length || 0
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error('=== ERROR CRÍTICO EN get-google-tokens ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    // Asegurar que SIEMPRE retornamos JSON, nunca HTML
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener tokens',
      code: 'INTERNAL_ERROR',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
