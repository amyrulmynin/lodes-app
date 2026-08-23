# 🍰 Lodes - Dessert Business Elite Affiliate Platform

Web application untuk perniagaan dessert dengan sistem affiliate marketing, commission tracking, dan order management.

## ✨ Features

### Admin Features
- ✅ Manage desserts (tambah, edit, delete)
- ✅ Set commission rates untuk setiap dessert
- ✅ Review dan approve/reject orders dari affiliates
- ✅ Manage withdrawal requests
- ✅ Dashboard untuk monitor semua aktiviti

### Affiliate Features
- ✅ Submit orders untuk customers
- ✅ Track commission earnings
- ✅ View order history dan status
- ✅ Request withdrawals (minimum RM10)
- ✅ Update bank details untuk withdrawals

### Integrations
- ✅ WhatsApp API - Automatic order notifications
- ✅ Google Sheets API - Automatic order logging
- ✅ Neon PostgreSQL - Database
- ✅ NextAuth - Authentication

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Create `.env` file:

```env
# Database (Neon.tech PostgreSQL)
DATABASE_URL="postgresql://username:password@host.neon.tech/dbname?sslmode=require"

# Authentication
AUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# WhatsApp API (Optional)
WHATSAPP_API_URL=""
WHATSAPP_API_TOKEN=""
WHATSAPP_PHONE_NUMBER=""

# Google Sheets API (Optional)
GOOGLE_SHEETS_PRIVATE_KEY=""
GOOGLE_SHEETS_CLIENT_EMAIL=""
GOOGLE_SHEETS_SPREADSHEET_ID=""
```

### 3. Setup Database

```bash
# Generate migrations
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data
npx tsx scripts/seed.ts
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Database Schema

### Users Table
- id, email, password, name, role (admin/affiliate)
- phone, bankName, bankAccount
- commissionBalance

### Desserts Table
- id, name, description, price
- imageUrl, commissionRate, isActive

### Orders Table
- id, affiliateId, dessertId, quantity
- totalPrice, commissionAmount
- customerName, customerPhone, customerAddress, notes
- status (pending/accepted/rejected)

### Withdrawals Table
- id, affiliateId, amount
- bankName, bankAccount, accountHolder
- status (pending/accepted/rejected)
- notes

## 🔐 Demo Credentials

### Admin
- Email: admin@lodes.com
- Password: admin123

### Affiliate
- Email: affiliate@lodes.com
- Password: affiliate123

## 🌐 Deploy to Vercel

1. Push code to GitHub
2. Import project di Vercel
3. Add environment variables
4. Deploy!

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

## 📱 WhatsApp API Setup

Anda boleh gunakan services seperti:
- WhatsApp Business API
- Twilio WhatsApp API
- WA Gateway (third-party)

Update environment variables dengan API credentials.

## 📊 Google Sheets Setup

1. Create Google Cloud Project
2. Enable Google Sheets API
3. Create Service Account
4. Download credentials JSON
5. Share spreadsheet dengan service account email
6. Update environment variables

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Neon PostgreSQL, Drizzle ORM
- **Auth**: NextAuth v5
- **Deployment**: Vercel

## 📝 Project Structure

```
lodes-app/
├── app/
│   ├── api/          # API routes
│   ├── admin/        # Admin dashboard
│   ├── affiliate/    # Affiliate dashboard
│   └── login/        # Login page
├── components/
│   ├── admin/        # Admin components
│   ├── affiliate/    # Affiliate components
│   └── ui/           # UI components
├── db/
│   ├── schema.ts     # Database schema
│   └── index.ts      # Database connection
├── lib/
│   ├── auth.ts       # Authentication config
│   ├── utils.ts      # Utility functions
│   └── integrations/ # WhatsApp & Google Sheets
└── scripts/
    └── seed.ts       # Database seeding
```

## 📄 License

MIT License - feel free to use for your projects!

## 💡 Support

For issues or questions, please create an issue on GitHub.

---

Made with ❤️ for Lodes Dessert Business
