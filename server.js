const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// Configuración de Telegram (usa variables de entorno en Vercel)
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '7929110467:AAEvAlnqfT3UQR_eSlNCiI60AAVbZLAywJQ';
const CHAT_ID = process.env.CHAT_ID || '8051322214';

// Middleware para validar origen (opcional pero recomendado)
const validateRequest = (req, res, next) => {
  const authHeader = req.headers['x-helius-signature']; // Opcional: Header de seguridad
  if (!authHeader && process.env.NODE_ENV === 'production') {
    return res.status(403).send('No autorizado');
  }
  next();
};

// Función mejorada para enviar alertas
async function sendAlert(message) {
  try {
    console.log("=== INTENTANDO ENVIAR A TELEGRAM ===");
    console.log("Token:", process.env.TELEGRAM_TOKEN);
    console.log("Chat ID:", process.env.CHAT_ID);
    
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`;
    const response = await axios.post(url, {
      chat_id: process.env.CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    });
    
    console.log("✅ Respuesta de Telegram:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Error FATAL al enviar a Telegram:", {
      error: error.message,
      response: error.response?.data
    });
    return false;
  }
}

// Webhook de Helius (versión robusta)
app.post('/webhook', validateRequest, (req, res) => {
  console.log('🔔 Payload recibido:', JSON.stringify(req.body, null, 2));

  try {
    const { event } = req.body;

    // Validación de datos críticos
    if (!event || !event.source || !event.signature) {
      console.warn('⚠️ Estructura de datos inválida');
      return res.status(400).send('Datos incompletos');
    }

    // Filtro para tu wallet específica y monto
    if (event.source === "BmFdpraQhkiDQE6SnfG5omcA1VwzqfXrwtNYBwWTymy6" && event.amount === 99990000000) {
      const explorerUrl = `https://solscan.io/tx/${event.signature}`;
      const msg = `🚨 *99.99 SOL Enviados* 🚨\n\n▸ *Origen:* \`${event.source}\`\n▸ *Destino:* \`${event.destination || '?'}\`\n▸ [Ver en Solscan](${explorerUrl})`;
      sendAlert(msg);
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error('🔥 Error crítico:', error);
    res.status(500).send("Error interno");
  }
});

// Health Check (para Vercel)
app.get('/ping', (req, res) => res.sendStatus(200));
app.get('/', (req, res) => res.send('🔔 Webhook de Helius activo | /webhook | /ping'));

// Inicio del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor escuchando en puerto ${PORT}`));
