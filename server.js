const express = require('express');
const axios = require('axios');
const app = express();

// Middleware para manejar JSON
app.use(express.json());

// Configuración del bot de Telegram
const TELEGRAM_TOKEN = 'TU_TOKEN_DE_TELEGRAM';
const TELEGRAM_CHAT_ID = 'TU_CHAT_ID';

// Función para enviar notificaciones a Telegram
const sendTelegramNotification = async (message) => {
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
    });
  } catch (error) {
    console.error('Error al enviar la notificación a Telegram:', error);
  }
};

// Ruta del webhook
app.post('/webhook', (req, res) => {
  // Log para ver el payload recibido
  console.log('[HELIUS] 🔔 Payload recibido:', req.body);

  // Verificar si el payload contiene transacciones
  const transactions = req.body?.transactions;

  // Si no hay transacciones, retornar un log y responder correctamente sin error
  if (!transactions || transactions.length === 0) {
    console.log('[HELIUS] ⚠️ No se encontraron transacciones en el payload');
    return res.status(200).send('OK');
  }

  // Filtrar transacciones de 99.99 Solanas
  const filteredTransactions = transactions.filter(transaction => {
    return transaction.nativeBalanceChange === 99.99;  // Filtro de transacciones con exactamente 99.99 Solanas
  });

  // Log del número de transacciones encontradas
  console.log(`[HELIUS] ✔️ Número de transacciones encontradas: ${transactions.length}`);

  // Si no se encuentra ninguna transacción de 99.99 Solanas
  if (filteredTransactions.length === 0) {
    console.log('[HELIUS] ⚠️ No se encontraron transacciones de 99.99 Solanas');
    return res.status(200).send('OK');  // Aquí se responde bien, pero sin hacer nada
  }

  // Si encontramos transacciones de 99.99 Solanas, hacer algo con ellas (ej. log)
  console.log('[HELIUS] ✔️ Se encontraron transacciones de 99.99 Solanas:', filteredTransactions);

  // Log con las primeras 3 transacciones (o menos si no hay tantas)
  const sampleTransactions = filteredTransactions.slice(0, 3);  // Tres transacciones de ejemplo
  console.log('[HELIUS] ⚡️ Ejemplo de transacciones encontradas:', JSON.stringify(sampleTransactions));

  // Enviar notificación a Telegram solo si se encuentra una transacción de 99.99 Solanas
  const message = `Se encontraron transacciones de 99.99 Solanas: ${JSON.stringify(filteredTransactions)}`;
  sendTelegramNotification(message);

  // Responder correctamente al webhook
  return res.status(200).send('OK');
});

// Escuchar en el puerto 3000 (o el que necesites)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

