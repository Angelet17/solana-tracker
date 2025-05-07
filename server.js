const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// Configuración de Telegram (tus datos aquí)
const TELEGRAM_TOKEN = 'TU_TOKEN';
const CHAT_ID = 'TU_CHAT_ID';

// Función para enviar alertas
async function sendAlert(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await axios.post(url, { chat_id: CHAT_ID, text: message });
}

// Webhook de Helius
app.post('/webhook', (req, res) => {
  const tx = req.body;
  if (tx.from === "BmFdpraQhkiDQE6SnfG5omcA1VwzqfXrwtNYBwWTymy6" && tx.amount === 99990000000) {
    const msg = `🚨 99.99 SOL enviados!\nDe: ${tx.from}\nA: ${tx.to}\nTX: https://solscan.io/tx/${tx.signature}`;
    sendAlert(msg);
  }
  res.status(200).send("OK");
});

// Ruta para evitar que Vercel duerma (opcional)
app.get('/ping', (req, res) => res.sendStatus(200));

// ¡Nueva ruta añadida aquí!
app.get("/", (req, res) => {
  res.status(200).send("Webhook para KuCoin activo 🚀");
});

// Inicia el servidor
const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
