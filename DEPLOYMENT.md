# 🚀 Deploying PahadiGo

This guide outlines the production deployment strategy for the PahadiGo platform. As a modern Next.js 15+ repository, it is inherently optimized for Vercel, but functions flawlessly on AWS EC2, DigitalOcean, or standard Node.js runtime environments.

---

## ☁️ 1. Vercel (Recommended)

Because PahadiGo leverages advanced Next.js App Router functionality, Server Actions, and Edge Middleware, Vercel natively interprets the build graph and automatically scales the architecture.

1. **Dashboard Setup**: Push your repository to GitHub, GitLab, or Bitbucket.
2. **Project Import**: Inside Vercel, click **Add New Project** and import the PahadiGo repository.
3. **Environment Configuration**: Strictly configure these core variables in Vercel's *Environment Variables* tab:
   * `MONGODB_URI` (Point to your production Atlas cluster)
   * `JWT_SECRET` (Generate a new secure hash)
   * `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`
   * `CLOUDINARY_URL`
   * `SMTP_PASS`, `SMTP_USER`, `SMTP_HOST`
4. **Deploy**: Vercel executes `npm run build` natively.
5. **Cron Jobs**: If integrating regular jobs (like automated payout settlements), configure `vercel.json` with the required cron schema.

---

## 🐋 2. Docker & Custom Servers (AWS EC2 / DigitalOcean)

If data regulation or cost demands isolation outside Vercel, utilize a standard Node.js PM2 process.

### Step 1: Clone & Build
```bash
git clone https://github.com/pahadigo/pahadigo.git
cd pahadigo
npm install --production

# Pre-compile the aggressive optimizations
npm run build
```

### Step 2: PM2 Orchestration (Zero Downtime)
```bash
npm install -g pm2

# Start the cluster aggressively mapping to physical CPU cores
pm2 start npm --name "pahadigo-prod" -i max -- run start

# Ensure PM2 resurrects upon server reboot
pm2 startup
pm2 save
```

### Step 3: Nginx Reverse Proxy
PahadiGo will bind to `localhost:3000`. You must route standard web traffic (Ports 80/443) via Nginx explicitly to handle SSL termination.

```nginx
server {
    listen 80;
    server_name api.pahadigo.com pahadigo.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🗄️ 3. Database: MongoDB Atlas Production Strategy

Never use a `localhost` mongod instance for production.

1. Boot a dedicated dedicated or Serverless **MongoDB Atlas** cluster.
2. **IP Whitelisting**:
   * If on Vercel: Whitelist `0.0.0.0/0` (Since IPs are dynamic) and enforce a highly complex password.
   * If on AWS EC2: Explicitly whitelist the VPC or Elastic IP.
3. **Connection Pooling**: PahadiGo's `src/core/Config/db.js` specifically caches connections globally to avoid exhausting Atlas pools during sudden serverless spikes. Ensure scaling options on Atlas reflect your expected concurrent Vercel execution limits.
