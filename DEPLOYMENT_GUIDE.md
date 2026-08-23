# 🚀 Panduan Deployment Lodes App ke Vercel

## Prerequisites

- Account GitHub
- Account Vercel (free)
- Account Neon.tech untuk database (free tier available)

---

## Step 1: Setup Database di Neon.tech

1. **Pergi ke [https://neon.tech](https://neon.tech)**
   - Sign up dengan GitHub atau Google
   - Create new project
   - Nama project: `lodes-db`

2. **Copy Connection String**
   - Selepas project created, pergi ke Dashboard
   - Klik "Connection Details"
   - Copy connection string (pilih "Pooled connection")
   - Format: `postgresql://user:pass@host.neon.tech/dbname?sslmode=require`
   - **PENTING:** Save connection string ini untuk kemudian

3. **Setup Database Schema**
   
   Jalankan locally dulu untuk setup schema:
   ```bash
   # Install dependencies
   npm install
   
   # Setup .env file dengan DATABASE_URL dari Neon
   # Kemudian push schema
   npm run db:push
   
   # Seed initial data
   npm run seed
   ```

---

## Step 2: Push Code ke GitHub

1. **Initialize Git Repository**
   ```bash
   cd lodes-app
   git init
   git add .
   git commit -m "Initial commit: Lodes dessert business app"
   ```

2. **Create GitHub Repository**
   - Pergi ke [github.com/new](https://github.com/new)
   - Repository name: `lodes-app`
   - Set to Public atau Private
   - **Jangan** add README, .gitignore, atau license (dah ada)
   - Click "Create repository"

3. **Push ke GitHub**
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/lodes-app.git
   git push -u origin main
   ```

---

## Step 3: Deploy ke Vercel

1. **Login ke Vercel**
   - Pergi ke [vercel.com](https://vercel.com)
   - Login dengan GitHub account

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select `lodes-app` repository dari GitHub
   - Click "Import"

3. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. **Add Environment Variables**
   
   Click "Environment Variables" dan add yang berikut:

   **REQUIRED (Wajib):**
   ```
   DATABASE_URL = postgresql://user:pass@host.neon.tech/dbname?sslmode=require
   AUTH_SECRET = [generate dengan: openssl rand -base64 32]
   NEXTAUTH_URL = https://lodes-app.vercel.app (guna URL Vercel anda)
   ```

   **OPTIONAL (Boleh skip dulu, add kemudian):**
   ```
   WHATSAPP_API_URL = 
   WHATSAPP_API_TOKEN = 
   WHATSAPP_PHONE_NUMBER = 
   GOOGLE_SHEETS_PRIVATE_KEY = 
   GOOGLE_SHEETS_CLIENT_EMAIL = 
   GOOGLE_SHEETS_SPREADSHEET_ID = 
   ```

5. **Deploy**
   - Click "Deploy"
   - Tunggu 2-3 minit untuk build complete
   - Deployment success! 🎉

---

## Step 4: Verify Deployment

1. **Visit Production URL**
   - Click "Visit" button atau pergi ke URL yang diberikan
   - Contoh: `https://lodes-app.vercel.app`

2. **Test Login**
   - Email: `admin@lodes.com`
   - Password: `admin123`
   
   atau
   
   - Email: `affiliate@lodes.com`
   - Password: `affiliate123`

3. **Test Features**
   - Admin: Add dessert, view orders
   - Affiliate: Submit order, view commission

---

## Step 5: Custom Domain (Optional)

1. **Pergi ke Vercel Dashboard → Settings → Domains**

2. **Add Domain**
   - Masukkan domain anda (contoh: `lodes.my`)
   - Follow instructions untuk setup DNS

3. **Update NEXTAUTH_URL**
   - Pergi ke Settings → Environment Variables
   - Edit `NEXTAUTH_URL` kepada custom domain anda
   - Redeploy project

---

## Step 6: Setup Integrations (Optional)

### WhatsApp API

Jika mahu enable WhatsApp notifications:

1. **Setup Twilio atau WA Gateway service**
2. **Add environment variables di Vercel:**
   ```
   WHATSAPP_API_URL = [API endpoint]
   WHATSAPP_API_TOKEN = [token]
   WHATSAPP_PHONE_NUMBER = [phone number]
   ```
3. **Redeploy**

### Google Sheets API

Jika mahu enable automatic logging ke Google Sheets:

1. **Create Google Cloud Project & Service Account**
   (Refer SETUP.md untuk details)

2. **Add environment variables di Vercel:**
   ```
   GOOGLE_SHEETS_PRIVATE_KEY = [private key dari service account]
   GOOGLE_SHEETS_CLIENT_EMAIL = [service account email]
   GOOGLE_SHEETS_SPREADSHEET_ID = [spreadsheet ID]
   ```

3. **Redeploy**

---

## Post-Deployment Checklist

- [ ] Database connected dan seeded
- [ ] Login working (test admin & affiliate)
- [ ] Can create desserts (admin)
- [ ] Can submit orders (affiliate)
- [ ] Commission calculation working
- [ ] Withdrawal requests working
- [ ] Custom domain configured (if applicable)
- [ ] WhatsApp integration working (if enabled)
- [ ] Google Sheets logging working (if enabled)

---

## Troubleshooting

### Build Failed

**Error: Cannot find module**
- Ensure all dependencies dalam package.json
- Try: `npm install` locally first

**Error: Environment variable missing**
- Check semua required env vars added di Vercel
- DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL adalah wajib

### Runtime Errors

**Database Connection Failed**
- Verify DATABASE_URL format correct
- Check Neon project is active
- Ensure IP allowlist di Neon allows Vercel IPs (usually auto-allowed)

**Authentication Not Working**
- Verify NEXTAUTH_URL matches production URL
- Regenerate AUTH_SECRET if needed
- Clear browser cache/cookies

**500 Internal Server Error**
- Check Vercel logs: Dashboard → Project → Logs
- Check error details untuk specific issue

---

## Monitoring & Logs

1. **View Logs**
   - Vercel Dashboard → Your Project → Logs
   - Filter by: Runtime Logs, Build Logs, Static Logs

2. **Monitor Performance**
   - Vercel Dashboard → Analytics
   - Monitor response times, errors

3. **Database Monitoring**
   - Neon Dashboard → Monitoring
   - Check connections, queries performance

---

## Updates & Maintenance

### Deploy Updates

```bash
# Make changes to code
git add .
git commit -m "Description of changes"
git push origin main

# Vercel will auto-deploy!
```

### Database Updates

```bash
# Make schema changes in db/schema.ts
# Then push to database
npm run db:push

# Vercel will use updated schema on next deploy
```

---

## Security Best Practices

1. **Keep Environment Variables Secure**
   - Never commit .env file to GitHub
   - Use Vercel environment variables
   - Rotate AUTH_SECRET regularly

2. **Database Security**
   - Use strong passwords
   - Enable IP allowlist di Neon if needed
   - Regular backups (Neon has auto-backup)

3. **Regular Updates**
   - Update dependencies regularly: `npm update`
   - Monitor security advisories
   - Test before deploying

---

## Cost Estimate (Free Tier)

- **Vercel**: Free (Hobby plan)
  - Unlimited deployments
  - 100GB bandwidth/month
  - Automatic HTTPS

- **Neon.tech**: Free
  - 1 project
  - 10GB storage
  - 100 compute hours/month

- **Total**: RM 0/month! 🎉

---

## Support & Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Neon Docs**: [neon.tech/docs](https://neon.tech/docs)

---

Tahniah! Your Lodes app is now live! 🚀🍰
