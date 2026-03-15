# 🚇 PahadiGo Ngrok Strategy

To develop Webhook integrations (such as **Razorpay** real-time payment captures) and external third-party callbacks successfully, PahadiGo requires exposing your localized `localhost:3000` executing Next.js server to the public internet securely. We standardize this using **Ngrok**.

---

## 🚀 1. Setup Instructions

If you haven't installed Ngrok, execute the following command precisely for your environment. We fundamentally recommend an authenticated Ngrok agent mapping.

### Global Installation

**Mac (Homebrew):**
```bash
brew install ngrok/ngrok/ngrok
```

**Windows (Chocolatey):**
```powershell
choco install ngrok
```

**Linux (Apt):**
```bash
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
  | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null \
  && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" \
  | sudo tee /etc/apt/sources.list.d/ngrok.list \
  && sudo apt update && sudo apt install ngrok
```

### Authentication
Establish an account strictly on [ngrok.com](https://ngrok.com), retrieve your proprietary auth token from the unified dashboard, and assign it directly.

```bash
ngrok config add-authtoken <YOUR_NGROK_TOKEN>
```

---

## ⚡ 2. Executing Ngrok alongside PahadiGo

Run your Next.js cluster locally:

```bash
npm run dev
# Server initiates precisely at http://localhost:3000
```

In a discrete terminal instance, establish the secure tunnel:

```bash
ngrok http 3000
```

You will observe an output resembling:
```
Session Status                online
Account                       Your Name (Plan: Free)
Forwarding                    https://c4e9-182-45-78-10.ngrok-free.app -> http://localhost:3000
```

---

## 💳 3. Utilizing Webhooks (Razorpay)

Whenever the Next.js server restarts, and `ngrok` establishes a fresh randomized URL, you must orchestrate the latest URI mapping tightly.

1. Capture your secure `https://` payload URL from the Ngrok terminal.
2. Launch the **Razorpay Dashboard** -> Navigate directly to **Settings** -> **Webhooks**.
3. Point your endpoint directly to:
   * `https://c4e9-182-45-78-10.ngrok-free.app/api/webhooks/razorpay`
4. Attach these Active Events strictly:
   * `payment.captured`
   * `payment.failed`
   * `order.paid`
   * `refund.processed`
5. Align your Secret locally under `.env`:
   ```env
   RAZORPAY_WEBHOOK_SECRET=your_configured_secret
   ```

---

## ⚠️ 4. Security Advisories

* **Data Exposure**: Absolutely be cognizant that Ngrok entirely subverts local firewall restrictions. Any active endpoint built without `AuthMiddleware` protection is instantaneously available globally.
* **Persistent Tunnels**: Because the free tier randomizes `Forwarding` addresses, avoid deploying Ngrok outputs to non-ephemeral configurations unless you secure a dynamic static domain via a paid tier.
* **Token Rotation**: Terminate tunnels explicitly (`Ctrl + C`) immediately after validation to preclude latent vulnerability scanning.
