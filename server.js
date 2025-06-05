export default async function handler(req, res) {
  console.log("[HELIUS] 🏁 Iniciando procesamiento de la transacción...");

  // ✅ Respuesta rápida para evitar timeout
  res.status(200).send("OK");

  try {
    const payload = req.body;

    if (!payload || !Array.isArray(payload) || payload.length === 0) {
      console.warn("[HELIUS] ⚠️ Payload inválido o vacío");
      return;
    }

    console.log("[HELIUS] 🔔 Payload recibido:", JSON.stringify(payload, null, 2));

    const KUCOIN_WALLET = "BmFdpraQhkiDQE6SnfG5omcA1VwzqfXrwtNYBwWTymy6";
    const LAMPORTS_PER_SOL = 1_000_000_000;
    const MIN_AMOUNT_SOL = 100;

    // Filtra transacciones en las que está involucrada la wallet
    const transaccionesConWallet = payload.filter((tx) => {
      return (
        tx.nativeTransfers &&
        tx.nativeTransfers.some(
          (nt) => nt.fromUserAccount === KUCOIN_WALLET || nt.toUserAccount === KUCOIN_WALLET
        )
      );
    });

    if (transaccionesConWallet.length === 0) {
      console.log("[HELIUS] 📭 No se encontraron transacciones relevantes con la wallet.");
      return;
    }

    console.log(`[HELIUS] 🔍 ${transaccionesConWallet.length} transacciones encontradas con la wallet.`);

    console.log("[HELIUS] 📦 Ejemplo(s) de transacciones:");
    transaccionesConWallet.slice(0, 3).forEach((tx, idx) => {
      console.log(`  ➤ [${idx + 1}] ${tx.description}`);
    });

    // Buscar transacciones salientes de KuCoin con monto > 100 SOL
    const transaccionesObjetivo = transaccionesConWallet.filter((tx) =>
      tx.nativeTransfers.some((nt) =>
        nt.fromUserAccount === KUCOIN_WALLET &&
        nt.amount > MIN_AMOUNT_SOL * LAMPORTS_PER_SOL
      )
    );

    if (transaccionesObjetivo.length === 0) {
      console.log("[HELIUS] ⚠️ No se encontraron transacciones >100 SOL salientes.");
      return;
    }

    console.log(`[HELIUS] ✅ ${transaccionesObjetivo.length} transacción(es) con montos >100 SOL encontrada(s)!`);

    // 📨 Notificar por Telegram
    for (const tx of transaccionesObjetivo) {
      const transfer = tx.nativeTransfers.find(
        (nt) =>
          nt.fromUserAccount === KUCOIN_WALLET &&
          nt.amount > MIN_AMOUNT_SOL * LAMPORTS_PER_SOL
      );

      const solAmount = transfer.amount / LAMPORTS_PER_SOL;
      const txUrl = `https://solscan.io/tx/${tx.signature}`;

      const message = `🚨 *Transacción >100 SOL Detectada* 🚨

💸 *Cantidad:* ${solAmount} SOL
👛 *Destino:* ${transfer.toUserAccount}
🔗 [Ver en Solscan](${txUrl})
`;

      await enviarTelegramMensaje(message);
    }
  } catch (error) {
    console.error("[HELIUS] ❌ Error procesando webhook:", error);
  }
}

// 👇 Función auxiliar para enviar mensaje por Telegram
async function enviarTelegramMensaje(texto) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("[TELEGRAM] ❌ Faltan credenciales.");
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: texto,
        parse_mode: "Markdown",
      }),
    });

    if (!res.ok) {
      console.error("[TELEGRAM] ❌ Error enviando mensaje:", await res.text());
    } else {
      console.log("[TELEGRAM] ✅ Notificación enviada.");
    }
  } catch (err) {
    console.error("[TELEGRAM] ❌ Error en la solicitud:", err);
  }
}

