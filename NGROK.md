# 🚇 Local Edge Environment Webhook Mappings

Testing complex algorithmic execution layers requires successfully exposing local Next.js Edge handlers via Ngrok securely to ingest third-party callbacks, particularly for payment gateway simulations like Razorpay.

---

## ⚡ Setup Directives

1. **Start the Next.js Local Server:**
Ensure your development environment is actively running and accessible on port 3000.
```bash
npm run dev
```

2. **Authenticate and Start Ngrok Tunnel:**
Establish a secure HTTP tunnel pointing to your active Next.js port.
```bash
ngrok http 3000
```
*Note: Make sure your local ngrok CLI is authenticated with your developer token to prevent session timeouts.*

---

## 💳 Razorpay Configuration mapping

Inside your active Razorpay Dashboard, locate **Settings > Webhooks**. You must point the URL securely to your newly granted Ngrok identifier:

- **Webhook URL:** `https://<YOUR_NGROK_ID>.ngrok-free.app/api/payment/webhook`
- **Active Events:** Ensure you subscribe to required payment events (e.g., `payment.captured`, `order.paid`).

### Secret Verification
Ensure that the webhook signatures match the hash securely set locally inside your `.env` file as `RAZORPAY_WEBHOOK_SECRET`. This cryptographic handshake prevents simulated requests from unauthorized traffic over the ngrok tunnel.
