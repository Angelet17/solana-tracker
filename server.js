require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// Debug: Verificación inicial de variables
console.log('[CONFIG] Variables de entorno:', {
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN ? "✅ Cargado" : "❌ Faltante",
  CHAT_ID: process.env.CHAT_ID ? "✅ Cargado" : "❌ Faltante",
  NODE_ENV: process.env.NODE_ENV || 'development'
});

// Configuración de Telegram (usa valores por defecto SOLO para desarrollo)
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '7929110467:AAEvAlnqfT3UQR_eSlNCiI60AAVbZLAywJQ';
const CHAT_ID = process.env.CHAT_ID || '8051322214';

// Función robusta para enviar alertas a Telegram
async function sendAlert(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  console.log('[TELEGRAM] Enviando mensaje a:', url.replace(TELEGRAM_TOKEN, 'TOKEN_OCULTO'));

  try {
    const response = await axios.post(url, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    }, {
      timeout: 5000 // Timeout de 5 segundos
    });
    console.log('[TELEGRAM] ✅ Notificación enviada');
    return true;
  } catch (error) {
    console.error('[TELEGRAM] ❌ Error:', {
      status: error.response?.status,
      error: error.response?.data || error.message
    });
    return false;
  }
}

// Endpoint de prueba independiente
app.get('/test-telegram', async (req, res) => {
  try {
    await sendAlert("🔔 Prueba de conexión con Telegram (Funcionalidad activa)");
    res.send("✅ Prueba exitosa. Revisa Telegram.");
  } catch (error) {
    res.status(500).send(`❌ Error: ${error.message}`);
  }
});

// Webhook principal para Helius (con manejo de errores)
app.post('/webhook', async (req, res) => {
  try {
    console.log('[HELIUS] 🔔 Payload recibido:', JSON.stringify(req.body, null, 2));
    const { event } = req.body;

    // Validación básica del payload
    if (!event || !event.source || !event.signature) {
      console.warn('[HELIUS] ⚠️ Payload inválido');
      return res.status(400).send('Datos incompletos');
    }

    // Filtro para la transacción específica
    if (event.source === "BmFdpraQhkiDQE6SnfG5omcA1VwzqfXrwtNYBwWTymy6" && event.amount === 99990000000) {
      const explorerUrl = `https://solscan.io/tx/${event.signature}`;
      const msg = `🚨 *99.99 SOL Enviados* 🚨\n\n▸ *Origen:* \`${event.source}\`\n▸ [Ver TX](${explorerUrl})`;
      
      console.log('[HELIUS] Notificando transacción...');
      await sendAlert(msg); // Await para asegurar el envío
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error('[HELIUS] 🔥 Error crítico:', error);
    res.status(500).send("Error interno");
  }
});

// Health checks
app.get('/ping', (req, res) => res.sendStatus(200));
app.get('/', (req, res) => res.send('🟢 Webhook operativo. Endpoints: /webhook (POST), /test-telegram (GET)'));

// Inicio del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor escuchando en puerto ${PORT} | Modo: ${process.env.NODE_ENV || 'development'}`));
