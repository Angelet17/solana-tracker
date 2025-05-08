// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// Config vars
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Seguridad: Validación de tokens
if (!TELEGRAM_TOKEN || !CHAT_ID) {
  console.error("❌ Faltan variables de entorno necesarias (TELEGRAM_TOKEN o CHAT_ID)");
  process.exit(1);
}

// Telegram alert function
async function sendAlert(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
    console.log('[TELEGRAM] ✅ Notificación enviada');
  } catch (err) {
    console.error('[TELEGRAM] ❌ Error al enviar notificación:', err.response?.data || err.message);
  }
}

// Ruta básica para pruebas
app.get('/', (req, res) => res.send('🟢 Webhook operativo'));
app.get('/ping', (req, res) => res.status(200).send('OK'));
app.get('/test-telegram', async (req, res) => {
  await sendAlert('🔔 Prueba de conexión con Telegram');
  res.send('✅ Mensaje de prueba enviado a Telegram');
});

// Webhook para Helius
app.post('/webhook', async (req, res) => {
  console.log('[HELIUS] 🔔 Payload recibido');
  const { event } = req.body;

  if (!event || !event.source || !event.amount || !event.signature) {
    console.warn('[HELIUS] ⚠️ Payload inválido');
    return res.status(400).send('Payload incompleto');
  }

  // Filtro de transacción saliente específica
  if (event.source === "BmFdpraQhkiDQE6SnfG5omcA1VwzqfXrwtNYBwWTymy6" && event.amount === 99990000000) {
    const explorerUrl = `https://solscan.io/tx/${event.signature}`;
    const msg = `🚨 *99.99 SOL Enviados*\n\n▸ *Origen:* \`${event.source}\`\n▸ [Ver TX](${explorerUrl})`;

    console.log('[HELIUS] Coincidencia encontrada. Enviando notificación...');
    await sendAlert(msg);
  }

  res.status(200).send("OK");
});

// Servidor en modo local (útil solo en dev o testing local)
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}

// Export para Vercel
module.exports = app;

