# 🚇 Local Edge Environment Webhook Mappings

Testing complex algorithmic execution layers requires successfully exposing local Next.js Edge handlers via Ngrok securely to ingest third-party callbacks.

---

## ⚡ Setup Directives

1. Start the Next.js localhost port:
```bash
npm run dev
```

2. Authenticate and start an Ngrok secure tunnel pointing to your active Next.js Port (3000):
```bash
ngrok http 3000
```

## 💳 Razorpay Configuration mapping

Inside your active Razorpay Dashboard, locate Webhooks. You must point the URL configuration securely to your newly granted Ngrok identifier:
- `https://<YOUR_NGROK_ID>.ngrok-free.app/api/payment/webhook`

Ensure that the webhook signatures match the hash set safely locally inside your `.env` key as `RAZORPAY_WEBHOOK_SECRET`.
