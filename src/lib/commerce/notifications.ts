import type { OrderRecord } from "../../types/order";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendTelegramMessage(html: string, botToken: string, chatId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: html,
        parse_mode: "HTML",
      }),
      signal: AbortSignal.timeout(5000),
    });

    return res.ok;
  } catch (err) {
    console.error("Помилка відправки в Telegram:", err);
    return false;
  }
}

export async function notifyOrderPaid(
  order: OrderRecord,
  botToken: string,
  chatId: string
): Promise<boolean> {
  const itemsText = order.items
    .map(
      (it) => `• ${escapeHtml(it.title)} — ${it.quantity} шт. × ${(it.unitPriceMinor / 100).toFixed(2)} ₴`
    )
    .join("\n");

  const html =
    `🟢 <b>ЗАМОВЛЕННЯ ОПЛАЧЕНО! (#${escapeHtml(order.orderNumber)})</b>\n\n` +
    `💰 <b>Сума:</b> ${(order.totalMinor / 100).toFixed(2)} ₴ (LiqPay)\n` +
    (order.paymentId ? `🆔 <b>ID платежу:</b> <code>${escapeHtml(order.paymentId)}</code>\n` : "") +
    `👤 <b>Клієнт:</b> ${escapeHtml(order.customer.fullName)}\n` +
    `📞 <b>Телефон:</b> ${escapeHtml(order.customer.phone)}\n` +
    (order.customer.comment ? `💬 <b>Коментар:</b> ${escapeHtml(order.customer.comment)}\n` : "") +
    `\n📦 <b>Доставка (Нова Пошта):</b>\n` +
    `📍 ${escapeHtml(order.delivery.cityName)}\n` +
    `🏢 ${escapeHtml(order.delivery.warehouseName)}\n\n` +
    `🛒 <b>Товари:</b>\n${itemsText}`;

  return sendTelegramMessage(html, botToken, chatId);
}

export async function notifyOrderOffline(
  order: OrderRecord,
  botToken: string,
  chatId: string
): Promise<boolean> {
  const itemsText = order.items
    .map(
      (it) => `• ${escapeHtml(it.title)} — ${it.quantity} шт. × ${(it.unitPriceMinor / 100).toFixed(2)} ₴`
    )
    .join("\n");

  const html =
    `🟡 <b>НОВЕ ЗАМОВЛЕННЯ (ОЧІКУЄ ПІДТВЕРДЖЕННЯ) (#${escapeHtml(order.orderNumber)})</b>\n\n` +
    `💰 <b>Сума:</b> ${(order.totalMinor / 100).toFixed(2)} ₴ (Оплата при отриманні/за реквізитами)\n` +
    `👤 <b>Клієнт:</b> ${escapeHtml(order.customer.fullName)}\n` +
    `📞 <b>Телефон:</b> ${escapeHtml(order.customer.phone)}\n` +
    (order.customer.comment ? `💬 <b>Коментар:</b> ${escapeHtml(order.customer.comment)}\n` : "") +
    `\n📦 <b>Доставка (Нова Пошта):</b>\n` +
    `📍 ${escapeHtml(order.delivery.cityName)}\n` +
    `🏢 ${escapeHtml(order.delivery.warehouseName)}\n\n` +
    `🛒 <b>Товари:</b>\n${itemsText}`;

  return sendTelegramMessage(html, botToken, chatId);
}
