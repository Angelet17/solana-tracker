const express = require('express');
const axios = require('axios');
const app = express();

// Configuración para recibir datos en formato JSON
app.use(express.json());

// Función para enviar mensajes a Telegram
async function sendAlert(message) {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
  await axios.post(telegramUrl, {
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown',
  });
}

// Endpoint para recibir el Webhook
app.post('/webhook', async (req, res) => {
  try {
    const { event } = req.body;
    console.log('[HELIUS] 🔔 Payload recibido:', event);

    if (!event || !event.source || !event.signature) {
      console.warn('[HELIUS] ⚠️ Payload inválido');
      return res.status(400).send('Datos incompletos');
    }

    // Verificar si la transacción es de 99.99 SOL
    const expectedAmountSOL = 99990000000;  // 99.99 SOL (en lamports)
    
    // Validar si la transacción es del monto correcto y de la cuenta correcta
    if (event.nativeBalanceChange === expectedAmountSOL && event.source === 'BmFdpraQhkiDQE6SnfG5omcA1VwzqfXrwtNYBwWTymy6') {
      console.log('[HELIUS] 🔔 Transacción válida de 99.99 SOL encontrada:', event);
      const explorerUrl = `https://solscan.io/tx/${event.signature}`;
      const msg = `🚨 *99.99 SOL Enviados* 🚨\n\n▸ *Origen:* \`${event.source}\`\n▸ [Ver TX](${explorerUrl})`;

      console.log('[HELIUS] Notificando transacción...');
      await sendAlert(msg);  // Enviar mensaje a Telegram
    } else {
      console.log('[HELIUS] 🔍 Transacción no coincide con los criterios.');
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error('[HELIUS] 🔥 Error crítico:', error);
    res.status(500).send("Error interno");
  }
});

// Puerto de escucha
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

