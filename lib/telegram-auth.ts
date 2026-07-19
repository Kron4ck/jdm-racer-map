import { createHmac } from "crypto";

export interface TelegramUser {
  telegram_id: number;
  username:    string | null;
  first_name:  string;
  last_name:   string | null;
  photo_url:   string | null;
}

/**
 * Validates Telegram Mini App initData using HMAC-SHA256.
 * Algorithm: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * Returns parsed user fields, or null if the signature is invalid.
 */
export function validateTelegramInitData(
  initData: string,
  botToken: string,
): TelegramUser | null {
  try {
    const params = new URLSearchParams(initData);
    const receivedHash = params.get("hash");
    if (!receivedHash) return null;

    // Build the data-check string: all fields except hash, sorted, joined with \n
    params.delete("hash");
    const checkString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    // secret_key = HMAC-SHA256("WebAppData", botToken)
    const secretKey = createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    const expectedHash = createHmac("sha256", secretKey)
      .update(checkString)
      .digest("hex");

    if (expectedHash !== receivedHash) return null;

    // Reject data older than 24 hours
    const authDate = Number(params.get("auth_date") ?? 0);
    if (Date.now() / 1000 - authDate > 86_400) return null;

    const userRaw = params.get("user");
    if (!userRaw) return null;
    const user = JSON.parse(userRaw);

    return {
      telegram_id: user.id,
      username:    user.username    ?? null,
      first_name:  user.first_name  ?? "",
      last_name:   user.last_name   ?? null,
      photo_url:   user.photo_url   ?? null,
    };
  } catch {
    return null;
  }
}
