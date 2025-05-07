const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// Configuración de Telegram
const TELEGRAM_TOKEN = '7929110467:AAEvAlnqfT3UQR_eSlNCiI60AAVbZLAywJQ'; 
const CHAT_ID = '8051322214'; 

// Función para enviar alertas a Telegram
async function sendTelegramAlert(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: message,
    });
    console.log("Alerta enviada a Telegram");
  } catch (error) {
    console.error("Error enviando a Telegram:", error.message);
  }
}

// Ruta del webhook
app.post('/webhook', (req, res) => {
  const transaction = req.body;
  console.log("Transacción recibida:", transaction);

  // Filtro: 99.99 SOL enviados desde KuCoin
  const isFromKuCoin = transaction.from === "BmFdpraQhkiDQE6SnfG5omcA1VwzqfXrwtNYBwWTymy6";
  const is99_99SOL = transaction.amount === 99_990_000_000; // 99.99 SOL en lamports

  if (isFromKuCoin && is99_99SOL) {
    const alertMessage = `🚨 ¡Se enviaron 99.99 SOL desde KuCoin!\n\n- From: ${transaction.from}\n- To: ${transaction.to}\n- TX: https://solscan.io/tx/${transaction.signature}`;
    sendTelegramAlert(alertMessage);
  }

  res.status(200).send("OK");
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
