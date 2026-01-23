# Using ngrok for Local API Testing

This project uses Next.js, typically running on `http://localhost:3000`. To test your local API from external services (like mobile apps or webhooks), you can use **ngrok**.

## 1. Installation

If you haven't installed ngrok yet, follow the [official installation guide](https://dashboard.ngrok.com/get-started/setup).

- **Windows (Chocolatey):** `choco install ngrok`
- **Windows (Download):** [ngrok.com/download](https://ngrok.com/download)

## 2. Authentication

Sign up at [ngrok.com](https://ngrok.com/) to get your authtoken.

```powershell
ngrok config add-authtoken <YOUR_AUTH_TOKEN>
```

## 3. Running ngrok

Once your local server is running (`npm run dev`), start ngrok to expose port 3000:

```powershell
ngrok http 3000
```

Ngrok will provide a public URL (e.g., `https://random-id.ngrok-free.app`).

## 4. Usage in this Project

- Use the **ngrok URL** as the base URL for your API calls in Postman or your mobile app.
- Update your `.env` file if any callback URLs (like Razorpay webhooks) need to point to the public address.

> [!TIP]
> You can use the provided workflow to quickly see the command for starting ngrok.
