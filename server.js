require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// Debug: Verificar carga de variables
console.log('[DEBUG] Variables de entorno:', {
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN ? "✅ Cargado" : "❌ Faltante",
  CHAT_ID: process.env.CHAT_ID ? "✅ Cargado" : "❌ Faltante",
  NODE_ENV: process.env.NODE_ENV || 'development'
});

// Configuración de Telegram
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '7929110467:AAEvAlnqfT3UQR_eSlNCiI60AAVbZLAywJQ';
const CHAT_ID = process.env.CHAT_ID || '8051322214';

// Función mejorada para enviar alertas con logs detallados
async function sendAlert(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  console.log('[DEBUG] URL de Telegram:', url.replace(TELEGRAM_TOKEN, 'TOKEN_OCULTO')); // Para seguridad

  try {
    const response = await axios.post(url, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    }, {
      timeout: 5000 // Timeout de 5 segundos
    });
    console.log('[DEBUG] ✅ Respuesta de Telegram:', {
      status: response.status,
      data: response.data
    });
    return true;
  } catch (error) {
    console.error('[DEBUG] ❌ Error en sendAlert:', {
      status: error.response?.status,
      error: error.response?.data || error.message,
      stack: error.stack // Solo para desarrollo
    });
    return false;
  }
}

// Endpoint de prueba directa a Telegram
app.get('/test-telegram', async (req, res) => {
  console.log('[DEBUG] Probando conexión con Telegram...');
  try {
    await sendAlert("🔔 Mensaje de prueba desde Vercel");
    res.send("✅ Prueba exitosa. Revisa Telegram y los logs.");
  } catch (error) {
    res.status(500).send(`❌ Error: ${error.message}`);
  }
});

// Webhook principal con logs detallados
app.post('/webhook', (req, res) => {
  console.log('[DEBUG] 🔔 Payload recibido:', JSON.stringify(req.body, null, 2));

  try {
    const { event } = req.body;
    if (!event) {
      console.warn('[DEBUG] ⚠️ Payload sin campo "event"');
      return res.status(400).send('Datos incompletos');
    }

    // Debug: Verificar estructura del evento
    console.log('[DEBUG] Estructura del evento:', {
      source: event.source,
      amount: event.amount,
      signature: event.signature
    });

    if (event.source === "BmFdpraQhkiDQE6SnfG5omcA1VwzqfXrwtNYBwWTymy6" && event.amount === 99990000000) {
      const explorerUrl = `https://solscan.io/tx/${event.signature}`;
      const msg = `🚨 *99.99 SOL Enviados* 🚨\n\n▸ *Origen:* \`${event.source}\`\n▸ [Ver TX](${explorerUrl})`;
      
      console.log('[DEBUG] Mensaje preparado para Telegram:', msg);
      sendAlert(msg).then(success => {
        console.log(success ? '[DEBUG] Notificación enviada' : '[DEBUG] Falló el envío');
      });
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error('[DEBUG] 🔥 Error crítico:', error);
    res.status(500).send("Error interno");
  }
});

// Health Check
app.get('/ping', (req, res) => res.sendStatus(200));
app.get('/', (req, res) => res.send('🔔 Webhook activo. Endpoints: /webhook (POST), /test-telegram (GET)'));

// Inicio del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[DEBUG] 🚀 Servidor escuchando en puerto ${PORT}`));
