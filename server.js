const axios = require('axios');

exports.handler = async (event) => {
  try {
    // Parseamos el payload recibido del webhook
    const payload = JSON.parse(event.body);

    console.log('[HELIUS] 🔔 Payload recibido:', payload);

    if (!payload || payload.length === 0) {
      console.log('[HELIUS] ⚠️ No se encontraron transacciones.');
      return { statusCode: 200, body: 'No transactions found' };
    }

    // Almacenamos las transacciones encontradas
    const transacciones = [];
    let numTransacciones = 0;

    // Recorremos todas las transacciones recibidas
    for (const tx of payload) {
      console.log('[HELIUS] ⚡️ Procesando transacción:', tx);

      // Filtramos solo las transacciones con 99.99 SOL (en caso de que el monto sea en SOL)
      const nativeTransfer = tx.nativeTransfers.find(transfer => {
        return transfer.amount === 9999000000; // 99.99 SOL en lamports
      });

      if (nativeTransfer) {
        numTransacciones++;
        transacciones.push(tx);
      }
    }

    if (numTransacciones === 0) {
      console.log('[HELIUS] ⚠️ No se encontraron transacciones con 99.99 SOL.');
    } else {
      console.log(`[HELIUS] ✅ ${numTransacciones} transacción(es) de 99.99 SOL encontradas.`);

      // Muestra tres transacciones de ejemplo (para depuración manual)
      console.log('[HELIUS] Ejemplos de transacciones encontradas:', transacciones.slice(0, 3));
      
      // Aquí iría el código para enviar la notificación a Telegram
      if (numTransacciones > 0) {
        await sendTelegramNotification(transacciones);
      }
    }

    return { statusCode: 200, body: 'Webhook processed successfully' };
  } catch (error) {
    console.error('[HELIUS] ❌ Error procesando webhook:', error);
    return { statusCode: 500, body: 'Error processing webhook' };
  }
};

// Función para enviar una notificación a Telegram
async function sendTelegramNotification(transacciones) {
  const telegramUrl = `https://api.telegram.org/botYOUR_BOT_API_KEY/sendMessage`;
  const chatId = 'YOUR_CHAT_ID';

  const message = `Transacción detectada de 99.99 SOL:\n` + transacciones.map(tx => {
    return `Transacción: ${tx.signature}\nDe: ${tx.nativeTransfers[0].fromUserAccount}\nA: ${tx.nativeTransfers[0].toUserAccount}\nMonto: 99.99 SOL`;
  }).join('\n\n');

  try {
    await axios.post(telegramUrl, {
      chat_id: chatId,
      text: message,
    });
    console.log('[HELIUS] 📲 Notificación enviada a Telegram');
  } catch (err) {
    console.error('[HELIUS] ❌ Error enviando notificación a Telegram:', err);
  }
}

