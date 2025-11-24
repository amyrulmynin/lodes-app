# 🚀 Setup Guide Lengkap - Lodes App

## 1️⃣ Setup Neon Database (PostgreSQL)

### Langkah-langkah:

1. **Pergi ke [Neon.tech](https://neon.tech)**
   - Sign up atau login
   - Create new project
   - Pilih region terdekat (Singapore recommended)

2. **Get Connection String**
   - Selepas project created, copy connection string
   - Format: `postgresql://username:password@host.neon.tech/dbname?sslmode=require`
   - Save dalam `.env` file sebagai `DATABASE_URL`

3. **Setup Database Schema**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Seed Initial Data**
   ```bash
   npx tsx scripts/seed.ts
   ```

---

## 2️⃣ Setup NextAuth Authentication

### Langkah-langkah:

1. **Generate AUTH_SECRET**
   ```bash
   openssl rand -base64 32
   ```
   Copy output dan paste dalam `.env` sebagai `AUTH_SECRET`

2. **Set NEXTAUTH_URL**
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.vercel.app`

---

## 3️⃣ Setup WhatsApp API (Optional)

### Option 1: Twilio WhatsApp API

1. **Pergi ke [Twilio](https://www.twilio.com)**
   - Sign up untuk account
   - Activate WhatsApp Sandbox atau setup WhatsApp Business

2. **Get Credentials**
   - Account SID
   - Auth Token
   - WhatsApp Number

3. **Update .env**
   ```env
   WHATSAPP_API_URL="https://api.twilio.com/2010-04-01/Accounts/{AccountSID}/Messages.json"
   WHATSAPP_API_TOKEN="your-auth-token"
   WHATSAPP_PHONE_NUMBER="whatsapp:+60123456789"
   ```

### Option 2: WA Gateway (Alternative)

1. Gunakan third-party services seperti:
   - Fonnte.com
   - WooWA.id
   - WANotif.id

2. Follow their documentation untuk setup API

---

## 4️⃣ Setup Google Sheets API

### Langkah-langkah:

1. **Pergi ke [Google Cloud Console](https://console.cloud.google.com)**
   - Create new project
   - Enable "Google Sheets API"

2. **Create Service Account**
   - Pergi ke "Credentials"
   - Create Credentials → Service Account
   - Download JSON key file

3. **Get Credentials dari JSON**
   ```json
   {
     "client_email": "your-service-account@project.iam.gserviceaccount.com",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   }
   ```

4. **Create Google Sheet**
   - Create new spreadsheet
   - Share dengan service account email (dengan permission Editor)
   - Copy spreadsheet ID dari URL:
     `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

5. **Setup Sheet Structure**
   - Create sheet bernama "Orders"
   - Add headers di row 1:
     ```
     Order ID | Date | Customer Name | Phone | Dessert | Quantity | Total | Commission | Affiliate | Status
     ```

6. **Update .env**
   ```env
   GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_SHEETS_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
   GOOGLE_SHEETS_SPREADSHEET_ID="your-spreadsheet-id"
   ```

---

## 5️⃣ Deploy ke Vercel

### Langkah-langkah:

1. **Push ke GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/lodes-app.git
   git push -u origin main
   ```

2. **Import di Vercel**
   - Pergi ke [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import repository dari GitHub
   - Pilih "lodes-app" repository

3. **Add Environment Variables di Vercel**
   - Settings → Environment Variables
   - Add semua variables dari `.env`:
     - DATABASE_URL
     - AUTH_SECRET
     - NEXTAUTH_URL (guna production URL)
     - WHATSAPP_API_URL (optional)
     - WHATSAPP_API_TOKEN (optional)
     - WHATSAPP_PHONE_NUMBER (optional)
     - GOOGLE_SHEETS_PRIVATE_KEY (optional)
     - GOOGLE_SHEETS_CLIENT_EMAIL (optional)
     - GOOGLE_SHEETS_SPREADSHEET_ID (optional)

4. **Deploy**
   - Click "Deploy"
   - Tunggu deployment complete
   - Visit production URL!

---

## 6️⃣ Testing

### Test Login:

**Admin Account:**
- Email: admin@lodes.com
- Password: admin123

**Affiliate Account:**
- Email: affiliate@lodes.com
- Password: affiliate123

### Test Features:

1. **Admin:**
   - Login sebagai admin
   - Tambah dessert baru
   - View pending orders
   - Approve order
   - Process withdrawal

2. **Affiliate:**
   - Login sebagai affiliate
   - Submit order
   - Check commission balance
   - Request withdrawal

---

## 🔧 Troubleshooting

### Database connection failed
- Check DATABASE_URL format
- Ensure Neon project is active
- Check firewall/network settings

### Authentication not working
- Regenerate AUTH_SECRET
- Clear browser cookies
- Check NEXTAUTH_URL matches current domain

### WhatsApp notifications not sending
- Verify API credentials
- Check API endpoint URL
- Review Twilio/service dashboard for errors

### Google Sheets not updating
- Verify service account has Editor access to sheet
- Check private key format (keep \n)
- Ensure sheet name is exactly "Orders"

---

## 📞 Support

Jika ada issues atau questions:
1. Check error logs di terminal
2. Check Vercel deployment logs
3. Review API service dashboards (Twilio, Google Cloud)

---

## ✅ Checklist Setup

- [ ] Neon database created & connected
- [ ] Database schema pushed
- [ ] Initial data seeded
- [ ] AUTH_SECRET generated
- [ ] WhatsApp API configured (optional)
- [ ] Google Sheets API configured (optional)
- [ ] Tested locally
- [ ] Deployed to Vercel
- [ ] Environment variables added to Vercel
- [ ] Production tested

---

Selamat menggunakan Lodes App! 🎉
