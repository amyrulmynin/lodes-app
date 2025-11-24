# ⚡ Quick Start Guide - Lodes App

Panduan pantas untuk run projek locally dalam 5 minit!

---

## 🎯 Prerequisites

Pastikan anda ada:
- [x] Node.js 18+ installed
- [x] npm atau yarn
- [x] Account Neon.tech (free tier)

---

## 🚀 5-Minute Setup

### 1. Clone & Install (1 min)

```bash
cd /Users/amirul_minie/lodes-app
npm install
```

### 2. Setup Database (2 min)

**a) Create Neon Database:**
1. Pergi [neon.tech](https://neon.tech)
2. Sign up (free)
3. Create new project → nama: `lodes-db`
4. Copy connection string

**b) Setup Environment:**
```bash
# Create .env file
cp .env.example .env

# Edit .env dan paste:
DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname?sslmode=require"
AUTH_SECRET="run this: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

**c) Initialize Database:**
```bash
npm run db:push
npm run seed
```

### 3. Run Development Server (1 min)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Login Credentials

### Admin
```
Email: admin@lodes.com
Password: admin123
```

### Affiliate  
```
Email: affiliate@lodes.com
Password: affiliate123
```

---

## ✅ Quick Test

### Test Admin Flow:
1. Login as admin
2. Pergi "Desserts" tab
3. Click "Tambah Dessert"
4. Fill form → Submit
5. Pergi "Orders" tab
6. You'll see orders dari affiliates

### Test Affiliate Flow:
1. Login as affiliate
2. Click dessert card
3. Fill customer details
4. Submit order
5. View di "My Orders" tab
6. Check commission balance

---

## 🐛 Common Issues

### Issue: Database connection failed
**Fix:** 
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Should be: postgresql://user:pass@host.neon.tech/db?sslmode=require
```

### Issue: Auth not working
**Fix:**
```bash
# Regenerate AUTH_SECRET
openssl rand -base64 32

# Update .env dan restart server
```

### Issue: Module not found
**Fix:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Next Steps

1. **Customize Desserts**
   - Edit seeded desserts atau tambah yang baru
   - Upload images ke hosting (Imgur, Cloudinary, etc)

2. **Setup Integrations** (Optional)
   - [WhatsApp API Guide](./SETUP.md#3️⃣-setup-whatsapp-api-optional)
   - [Google Sheets Guide](./SETUP.md#4️⃣-setup-google-sheets-api)

3. **Deploy to Production**
   - Follow [Deployment Guide](./DEPLOYMENT_GUIDE.md)
   - Get live URL dalam 10 minit!

---

## 📖 Full Documentation

- **README.md** - Overview & features
- **SETUP.md** - Detailed setup instructions
- **DEPLOYMENT_GUIDE.md** - Vercel deployment
- **PROJECT_SUMMARY.md** - Technical details

---

## 💡 Pro Tips

1. **Database Studio**
   ```bash
   npm run db:studio
   # Opens Drizzle Studio untuk view/edit data
   ```

2. **Reset Database**
   ```bash
   npm run db:push -- --force
   npm run seed
   ```

3. **View Logs**
   ```bash
   # Terminal akan show request logs
   # Check browser console untuk errors
   ```

---

## 🎉 You're Ready!

App is running at: **http://localhost:3000**

Happy coding! 🍰
