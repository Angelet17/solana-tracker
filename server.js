require('dotenv').config(); // Añadir al inicio
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// Usar CONSTANTES definidas aquí en todo el código
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '7929110467:AAEvAlnqfT3UQR_eSlNCiI60AAVbZLAywJQ';
const CHAT_ID = process.env.CHAT_ID || '8051322214';

// Función sendAlert (usar las constantes)
async function sendAlert(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    });
    console.log("✅ Mensaje enviado a Telegram");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Webhook simplificado
app.post('/webhook', (req, res) => {
  console.log('🔔 Payload:', req.body);
  sendAlert("🚨 Prueba desde Vercel");
  res.status(200).send("OK");
});

app.listen(process.env.PORT || 3000, () => console.log("🚀 Servidor listo"));
