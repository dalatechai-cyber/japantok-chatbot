const DEFAULT_LABEL = '[chatbot-log]';
let missingWebhookWarned = false;

export async function logInteraction(entry = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    ...entry
  };

  console.log(DEFAULT_LABEL, JSON.stringify(payload));

  const webhookUrl = process.env.LOG_WEBHOOK_URL;
  if (!webhookUrl) {
    if (!missingWebhookWarned) {
      console.warn(`${DEFAULT_LABEL} warning`, 'LOG_WEBHOOK_URL not configured; falling back to console-only logging');
      missingWebhookWarned = true;
    }
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.warn(`${DEFAULT_LABEL} webhook_error`, error.message);
  }
}
