const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// Polyfill WebSocket para Node.js 18 (Supabase JS 2.39+ requiere Node.js 22+)
if (typeof WebSocket === 'undefined') {
  global.WebSocket = require('ws');
}

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
);

module.exports = supabase;
