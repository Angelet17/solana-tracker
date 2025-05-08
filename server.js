require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const KUCOIN_WALLET = 'BmFdpraQhkiDQE6SnfG5omcA1VwzqfXrwtNYBwWTymy6';
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
const NOTIFIED_RECEIVERS = new Set(); // Evitar notificaciones duplicadas

async function sendAlert(message) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
    console.log('[✅] Notificación enviada');
  } catch (error) {
    console.error('[❌] Error al enviar a Telegram:', error.response?.data || error.message);
  }
}

async function fetchAndCheckTransactions() {
  console.log('[🔄] Comprobando transacciones salientes de KuCoin...');

  try {
    const response = await axios.get(`https://api.helius.xyz/v0/addresses/${KUCOIN_WALLET}/transactions`, {
      params: {
        apiKey: HELIUS_API_KEY,
        limit: 100
      }
    });

    const transactions = response.data;

    for (const tx of transactions) {
      const source = tx?.source;
      const transfers = tx?.transfers || [];
      const signature = tx?.signature;

      // Confirmar que la wallet KuCoin sea la que envía
      for (const transfer of transfers) {
        if (
          transfer.from === KUCOIN_WALLET &&
          transfer.amount === 99990000000 && // 99.99 SOL en lamports
          !NOTIFIED_RECEIVERS.has(transfer.to)
        ) {
          const explorerUrl = `https://solscan.io/tx/${signature}`;
          const msg = `🚨 *Transferencia de 99.99 SOL detectada*\n\n▸ *Desde:* \`${KUCOIN_WALLET}\`\n▸ *Hacia:* \`${transfer.to}\`\n▸ [Ver transacción](${explorerUrl})`;

          await sendAlert(msg);
          NOTIFIED_RECEIVERS.add(transfer.to);
          console.log(`[🆕] Notificado receptor nuevo: ${transfer.to}`);
        }
      }
    }
  } catch (error) {
    console.error('[🔥] Error al consultar transacciones:', error.response?.data || error.message);
  }
}

// Iniciar chequeo periódico
setInterval(fetchAndCheckTransactions, CHECK_INTERVAL_MS);
fetchAndCheckTransactions(); // Ejecutar al iniciar

// Endpoint básico de estado
app.get('/', (req, res) => res.send('🟢 Webhook activo. Revisión automática cada 5 minutos.'));

// Iniciar servidor Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
});

// Ping y prueba de Telegram
app.get('/ping', (req, res) => res.sendStatus(200));
app.get('/test-telegram', async (req, res) => {
  try {
    await sendAlert("🔔 Prueba de conexión con Telegram");
    res.send("✅ Mensaje enviado.");
  } catch (error) {
    res.status(500).send("❌ Error enviando mensaje.");
  }
});

