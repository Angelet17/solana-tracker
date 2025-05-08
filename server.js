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
    const TARGET_AMOUNT_SOL = 99.99;
    const LAMPORTS_PER_SOL = 1_000_000_000;

    let transaccionesConWallet = payload.filter((tx) => {
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

    // Mostrar 3 ejemplos
    console.log("[HELIUS] 📦 Ejemplo(s) de transacciones:");
    transaccionesConWallet.slice(0, 3).forEach((tx, idx) => {
      console.log(`  ➤ [${idx + 1}] ${tx.description}`);
    });

    const transaccionesObjetivo = transaccionesConWallet.filter((tx) =>
      tx.nativeTransfers.some(
        (nt) =>
          (nt.fromUserAccount === KUCOIN_WALLET || nt.toUserAccount === KUCOIN_WALLET) &&
          nt.amount === TARGET_AMOUNT_SOL * LAMPORTS_PER_SOL
      )
    );

    if (transaccionesObjetivo.length === 0) {
      console.log("[HELIUS] ⚠️ No se encontraron transacciones con 99.99 SOL.");
      return;
    }

    console.log(`[HELIUS] ✅ ${transaccionesObjetivo.length} transacción(es) con 99.99 SOL encontrada(s)!`);

    // 📨 Notificar por Telegram
    for (const tx of transaccionesObjetivo) {
      const message = `🚨 Transacción de 99.99 SOL detectada 🚨\n\nHash: ${tx.signature}\nDescripción: ${tx.description}`;
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

