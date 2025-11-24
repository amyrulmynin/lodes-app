# ✅ Installation Checklist - Lodes App

Gunakan checklist ini untuk ensure semua setup correctly.

---

## 📋 Pre-Installation

- [ ] Node.js version 18+ installed
  ```bash
  node --version  # Should be v18.x.x or higher
  ```
- [ ] npm installed
  ```bash
  npm --version
  ```
- [ ] Git installed (optional, untuk version control)
  ```bash
  git --version
  ```

---

## 🔧 Installation Steps

### Step 1: Dependencies
- [ ] Navigate to project directory
  ```bash
  cd /Users/amirul_minie/lodes-app
  ```
- [ ] Install npm packages
  ```bash
  npm install
  ```
- [ ] Verify installation (no errors)

### Step 2: Database Setup
- [ ] Created account di [neon.tech](https://neon.tech)
- [ ] Created new project di Neon
- [ ] Copied connection string
- [ ] Created `.env` file dari `.env.example`
  ```bash
  cp .env.example .env
  ```
- [ ] Pasted DATABASE_URL dalam .env
- [ ] Generated AUTH_SECRET
  ```bash
  openssl rand -base64 32
  ```
- [ ] Pasted AUTH_SECRET dalam .env
- [ ] Set NEXTAUTH_URL = `http://localhost:3000`
- [ ] Pushed database schema
  ```bash
  npm run db:push
  ```
- [ ] Seeded initial data
  ```bash
  npm run seed
  ```

### Step 3: Run Application
- [ ] Started development server
  ```bash
  npm run dev
  ```
- [ ] Server running on http://localhost:3000
- [ ] No console errors

---

## 🧪 Testing Checklist

### Basic Functionality
- [ ] Homepage loads successfully
- [ ] Redirects to /login when not authenticated

### Admin Tests
- [ ] Can login dengan admin@lodes.com / admin123
- [ ] Redirected to /admin dashboard
- [ ] Can see "Desserts" tab
- [ ] Can see "Orders" tab
- [ ] Can see "Withdrawals" tab
- [ ] Can add new dessert
- [ ] Can view dessert list
- [ ] Can delete dessert
- [ ] Can view orders (if any)
- [ ] Can logout successfully

### Affiliate Tests
- [ ] Can login dengan affiliate@lodes.com / affiliate123
- [ ] Redirected to /affiliate dashboard
- [ ] Can see commission balance card
- [ ] Can see desserts list
- [ ] Can click dessert to order
- [ ] Can fill order form
- [ ] Can submit order
- [ ] Order appears in "My Orders" tab
- [ ] Can view withdrawal tab
- [ ] Can request withdrawal (if balance > RM10)
- [ ] Can logout successfully

### Cross-Testing (Admin + Affiliate)
- [ ] Login as affiliate → submit order
- [ ] Login as admin → see order in pending
- [ ] Accept order as admin
- [ ] Login back as affiliate → order status = accepted
- [ ] Affiliate balance increased
- [ ] Affiliate can request withdrawal
- [ ] Admin can see withdrawal request
- [ ] Admin can approve withdrawal
- [ ] Affiliate balance decreased

---

## 🔌 Optional Integrations

### WhatsApp API (Optional)
- [ ] Have WhatsApp API credentials
- [ ] Added WHATSAPP_API_URL to .env
- [ ] Added WHATSAPP_API_TOKEN to .env
- [ ] Added WHATSAPP_PHONE_NUMBER to .env
- [ ] Restarted server
- [ ] Submitted test order
- [ ] WhatsApp notification received

### Google Sheets API (Optional)
- [ ] Created Google Cloud Project
- [ ] Enabled Google Sheets API
- [ ] Created Service Account
- [ ] Downloaded credentials JSON
- [ ] Created Google Sheet
- [ ] Shared sheet dengan service account email
- [ ] Added GOOGLE_SHEETS_PRIVATE_KEY to .env
- [ ] Added GOOGLE_SHEETS_CLIENT_EMAIL to .env
- [ ] Added GOOGLE_SHEETS_SPREADSHEET_ID to .env
- [ ] Restarted server
- [ ] Submitted test order
- [ ] Order logged in Google Sheet

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passed locally
- [ ] .env file NOT committed to git
- [ ] Created GitHub repository
- [ ] Pushed code to GitHub
  ```bash
  git init
  git add .
  git commit -m "Initial commit"
  git remote add origin <your-repo-url>
  git push -u origin main
  ```

### Vercel Deployment
- [ ] Created Vercel account
- [ ] Imported project dari GitHub
- [ ] Added environment variables:
  - [ ] DATABASE_URL
  - [ ] AUTH_SECRET (regenerate untuk production)
  - [ ] NEXTAUTH_URL (production URL)
  - [ ] Optional: WhatsApp credentials
  - [ ] Optional: Google Sheets credentials
- [ ] Deployed successfully
- [ ] Production URL working
- [ ] Can login di production
- [ ] All features working di production

---

## 🐛 Troubleshooting Completed

Jika ada issues, check these:

### Issue: npm install failed
- [ ] Deleted node_modules
- [ ] Deleted package-lock.json
- [ ] Run `npm install` again
- [ ] Check Node.js version

### Issue: Database connection error
- [ ] Verified DATABASE_URL format
- [ ] Checked Neon project is active
- [ ] Checked internet connection
- [ ] Tried regenerating connection string

### Issue: Auth errors
- [ ] Regenerated AUTH_SECRET
- [ ] Cleared browser cookies
- [ ] Verified NEXTAUTH_URL correct
- [ ] Restarted server

### Issue: Seeding failed
- [ ] Verified database schema pushed
- [ ] Checked database is empty (no duplicate data)
- [ ] Manually deleted users/desserts tables dan retry

---

## 📚 Documentation Read

- [ ] Read README.md (overview)
- [ ] Read QUICK_START.md (5-min setup)
- [ ] Read SETUP.md (detailed setup)
- [ ] Skimmed PROJECT_SUMMARY.md (technical details)
- [ ] Bookmarked DEPLOYMENT_GUIDE.md (untuk later)

---

## ✨ Customization Done

- [ ] Changed default admin password
- [ ] Updated dessert data (if needed)
- [ ] Customized color scheme (optional)
- [ ] Added custom logo/branding (optional)
- [ ] Configured integrations (WhatsApp/Sheets)

---

## 🎓 Learning Completed

- [ ] Understand project structure
- [ ] Know how to add new dessert
- [ ] Know how order flow works
- [ ] Know how commission calculated
- [ ] Know how withdrawal process works
- [ ] Can troubleshoot common issues

---

## 🎉 Final Verification

- [ ] ✅ App running locally without errors
- [ ] ✅ Can login as admin
- [ ] ✅ Can login as affiliate
- [ ] ✅ Can perform all CRUD operations
- [ ] ✅ Database working correctly
- [ ] ✅ Authentication working
- [ ] ✅ All features tested
- [ ] ✅ Ready for production deployment!

---

## 📞 Need Help?

Jika stuck di mana-mana step:

1. **Check Terminal Logs**
   - Errors akan show di terminal
   - Read error messages carefully

2. **Check Browser Console**
   - Open DevTools (F12)
   - Check Console tab untuk errors

3. **Check Documentation**
   - README.md untuk overview
   - SETUP.md untuk detailed steps
   - PROJECT_SUMMARY.md untuk technical info

4. **Common Solutions**
   - Restart server: Ctrl+C, then `npm run dev`
   - Clear cache: Delete .next folder
   - Reinstall: `rm -rf node_modules && npm install`

---

## 🏁 You're Done!

Kalau semua checkboxes checked, congratulations! 🎉

Your Lodes app is:
- ✅ Fully installed
- ✅ Properly configured
- ✅ Tested and working
- ✅ Ready for production

**Next steps:**
1. Deploy to Vercel (optional)
2. Add your own desserts
3. Invite affiliates
4. Start earning! 💰

---

**Installation completed at:** _______________  
**Verified by:** _______________

Selamat menggunakan Lodes App! 🍰
