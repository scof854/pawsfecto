/**
 * One-shot helper: registers the Telegram webhook URL with Bot API.
 * Usage: TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_URL=... TELEGRAM_WEBHOOK_SECRET=... npm run telegram:set-webhook
 */
async function main() {
  const token = required('TELEGRAM_BOT_TOKEN');
  const url = required('TELEGRAM_WEBHOOK_URL');
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      secret_token: secret,
      allowed_updates: ['message', 'callback_query'],
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    console.error('setWebhook failed:', data);
    process.exit(1);
  }
  console.log('Webhook installed:', data);
}

function required(key: string): string {
  const v = process.env[key];
  if (!v) {
    console.error(`Missing required env: ${key}`);
    process.exit(1);
  }
  return v;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
