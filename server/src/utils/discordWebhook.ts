const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

export async function sendDiscordWebhook(message: string) {
  if (!webhookUrl) {
    console.error('DISCORD_WEBHOOK_URL is not set in environment variables.');
    return;
  }
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });

    if (!response.ok) {
      console.error('Discord webhook failed:', response.status, response.statusText);
    }
  } catch (err) {
    console.error('Failed to send Discord webhook:', err);
  }
}
