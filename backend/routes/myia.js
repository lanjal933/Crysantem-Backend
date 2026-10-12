const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { generalLimiter } = require('../middleware/rateLimiter');
const { myiaConfigValidation } = require('../middleware/validator');
const axios = require('axios');

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

    // Obtener configuración de la página con información de estado y límites
    const { data: pageConfig, error: configError } = await supabase
      .from('myia_page_config')
      .select('business_name, slug, system_prompt, plan, is_active, messages_limit, messages_used_this_month, current_month, current_year')
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
      chatInput: message
    });

    const signature = crypto
      .createHmac('sha256', config.security.n8nWebhookSecret)
      .update(timestamp + payload)
      .digest('hex');

    const response = await axios.post(webhookUrl, {
      slug: pageConfig.slug,          // Para que Supabase filtre y obtenga el system_prompt
      chatInput: message             // Coincide con la expresión {{ $('agente-workspace').first().json.chatInput }}
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': timestamp.toString()
      },
      timeout: 30000 // 30 segundos timeout
    });

    console.log('Respuesta de n8n recibida:', response.status);

    // ACTUALIZAR contador de mensajes
    await supabase
      .from('myia_page_config')
      .update({
        messages_used_this_month: messagesUsed + 1
      })
      .eq('id', pageId);

    console.log('Contador de mensajes actualizado:', messagesUsed + 1, '/', messageLimit);

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

    // Intento 1: Con todas las columnas
    const fullUpdateData = {
      business_name: config.business_name,
      slug: config.slug,
      logo_url: config.logo_url,
      logo_size: config.logo_size,
      background_type: config.background_type,
      background_color: config.background_color,
      background_gradient: config.background_gradient,
      glow_color: config.glow_color,
      font_family: config.font_family,
      title_font: config.title_font,
      chat_mode: config.chat_mode || 'embedded',
      chat_box_design: config.chat_box_design,
      chat_position: config.chat_position,
      border_radius: typeof config.border_radius === 'number' ? config.border_radius : 12,
      chat_box_color: config.chat_box_color,
      header_theme: config.header_theme,
      page_design: config.page_design,
      show_footer: config.show_footer,
      split_image: config.split_image,
      split_text: config.split_text,
      welcome_message: config.welcome_message,
      system_prompt: config.system_prompt,
      ai_model: config.ai_model,
      character_limit: config.character_limit,
      plan: config.plan,
      social_links: config.social_links,
      is_active: config.is_active,
      integrations_config: config.integrations_config || null,
      agent_name: config.agent_name || 'Asistente Virtual',
      agent_avatar: config.agent_avatar || null,
      quick_prompts: config.quick_prompts || [],
      lead_capture: config.lead_capture || 'none',
      payment_plan: config.payment_plan || null,
      payment_method: config.payment_method || null,
      google_connected: config.google_connected || false,
      super_prompt: config.super_prompt || null
    };

    // Intento 2: Solo columnas básicas (CON INTEGRACIONES)
    const basicUpdateData = {
      business_name: config.business_name,
      slug: config.slug,
      logo_url: config.logo_url,
      logo_size: config.logo_size,
      background_type: config.background_type,
      background_color: config.background_color,
      font_family: config.font_family,
      chat_position: config.chat_position,
      border_radius: config.border_radius,
      chat_box_color: config.chat_box_color,
      header_theme: config.header_theme,
      welcome_message: config.welcome_message,
      system_prompt: config.system_prompt,
      ai_model: config.ai_model,
      character_limit: config.character_limit,
      plan: config.plan,
      social_links: config.social_links,
      is_active: config.is_active,
      integrations_config: config.integrations_config || null,
      payment_plan: config.payment_plan || null,
      payment_method: config.payment_method || null,
      google_connected: config.google_connected || false,
      super_prompt: config.super_prompt || null
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

    const { data, error } = await supabase
      .from('myia_page_config')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting config by id:', error);
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
      responde: { monthly: 60000, annual: 50000, annualTotal: 600000, messagesLimit: 1000, minimumMonths: 3 },
      asiste: { monthly: 85000, annual: 70833, annualTotal: 850000, messagesLimit: 2500, minimumMonths: 3 },
      automatiza: { monthly: 150000, annual: 125000, annualTotal: 1500000, messagesLimit: 5000, minimumMonths: 6 },
      intelligence: { monthly: 190000, annual: 158333, annualTotal: 1900000, messagesLimit: 0, minimumMonths: 12 }
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
    body { background: ${getBackground()}; font-family: ${config.font_family || 'Inter'}; color: white; min-height: 100vh; }
    .container { min-height: 100vh; display: flex; flex-direction: column; padding: 40px; }
    .header { width: 100%; max-width: 800px; margin: 0 auto 40px; border-radius: 0; background: ${config.header_color || 'rgba(0,0,0,0.3)'}; display: flex; align-items: center; gap: 20px; padding: 20px; ${getHeaderStyle()} }
    .logo { width: ${config.logo_size || 100}px; height: ${config.logo_size || 100}px; object-fit: contain; border-radius: 8px; }
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

  <script src="/js/myia-auth.js"></script>
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
        monthly: 60000,
        annual: 50000,
        annualTotal: 600000,
        title: '01 - Responde',
        messagesLimit: 1000,
        minimumMonths: 3
      },
      asiste: {
        monthly: 85000,
        annual: 70833,
        annualTotal: 850000,
        title: '02 - Asiste',
        messagesLimit: 2500,
        minimumMonths: 3
      },
      automatiza: {
        monthly: 150000,
        annual: 125000,
        annualTotal: 1500000,
        title: '03 - Automatiza',
        messagesLimit: 5000,
        minimumMonths: 6
      },
      intelligence: {
        monthly: 15, // TEMPORAL: $15 ARS para prueba (mínimo MP)
        annual: 15, // TEMPORAL: $15 ARS para prueba (mínimo MP)
        annualTotal: 180, // TEMPORAL: $180 ARS anuales
        title: '04 - Crysantem Intelligence (PRUEBA)',
        messagesLimit: 0,
        minimumMonths: 12
      }
    };

    const planPrice = PLAN_PRICES[plan];
    if (!planPrice) {
      return res.status(400).json({ success: false, error: 'Plan inválido' });
    }

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
        monthly: 60000,
        annual: 50000,
        annualTotal: 600000,
        title: '01 - Responde',
        messagesLimit: 1000,
        minimumMonths: 3
      },
      asiste: {
        monthly: 85000,
        annual: 70833,
        annualTotal: 850000,
        title: '02 - Asiste',
        messagesLimit: 2500,
        minimumMonths: 3
      },
      automatiza: {
        monthly: 150000,
        annual: 125000,
        annualTotal: 1500000,
        title: '03 - Automatiza',
        messagesLimit: 5000,
        minimumMonths: 6
      },
      intelligence: {
        monthly: 15, // TEMPORAL: $15 ARS para prueba (mínimo MP)
        annual: 15, // TEMPORAL: $15 ARS para prueba (mínimo MP)
        annualTotal: 180, // TEMPORAL: $180 ARS anuales
        title: '04 - Crysantem Intelligence (PRUEBA)',
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

module.exports = router;
