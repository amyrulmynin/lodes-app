# 🍰 Lodes App - Project Summary

## 📋 Overview

**Lodes** adalah web application untuk perniagaan dessert (banana pudding) dengan sistem affiliate marketing yang lengkap. App ini membolehkan admin manage products dan affiliates submit orders untuk dapat commission.

---

## ✨ Core Features Implemented

### 👨‍💼 Admin Features
- ✅ **Dessert Management**
  - Add, edit, delete desserts
  - Set price dan commission rate untuk setiap dessert
  - Upload images (URL-based)
  
- ✅ **Order Management**
  - View semua orders dari affiliates
  - Filter by status (pending, accepted, rejected)
  - Approve atau reject orders
  - Commission automatically credited upon approval
  
- ✅ **Withdrawal Management**
  - View withdrawal requests
  - Approve atau reject withdrawals
  - Automatic balance deduction upon approval
  - Add notes untuk rejections

### 👥 Affiliate Features
- ✅ **Order Submission**
  - Browse available desserts
  - Submit orders dengan customer details
  - Calculate commission in real-time
  - Add notes untuk special requests
  
- ✅ **Commission Tracking**
  - View current balance
  - Track all submitted orders
  - See order status (pending/accepted/rejected)
  - Calculate earnings per order
  
- ✅ **Withdrawal System**
  - Request withdrawal (minimum RM10)
  - Input bank details
  - Track withdrawal status
  - View rejection notes from admin

---

## 🔧 Technical Stack

### Frontend
- **Next.js 14** - React framework dengan App Router
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Lucide React** - Icons

### Backend
- **Next.js API Routes** - RESTful API
- **NextAuth v5** - Authentication (credentials-based)
- **Drizzle ORM** - Type-safe database queries

### Database
- **Neon PostgreSQL** - Serverless PostgreSQL
- **Drizzle Kit** - Database migrations

### Integrations
- **WhatsApp API** - Order notifications (optional)
- **Google Sheets API** - Order logging (optional)

### Deployment
- **Vercel** - Hosting & CI/CD
- **GitHub** - Version control

---

## 📁 Project Structure

```
lodes-app/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/[...nextauth]/   # Authentication endpoint
│   │   ├── desserts/             # Desserts CRUD
│   │   ├── orders/               # Orders management
│   │   ├── withdrawals/          # Withdrawals management
│   │   └── profile/              # User profile
│   ├── admin/                    # Admin dashboard page
│   ├── affiliate/                # Affiliate dashboard page
│   ├── login/                    # Login page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home (redirect)
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── admin/                    # Admin-specific components
│   │   ├── dashboard.tsx
│   │   ├── desserts-manager.tsx
│   │   ├── orders-manager.tsx
│   │   └── withdrawals-manager.tsx
│   ├── affiliate/                # Affiliate-specific components
│   │   ├── dashboard.tsx
│   │   ├── submit-order.tsx
│   │   ├── orders-list.tsx
│   │   ├── commission-balance.tsx
│   │   └── withdrawals-list.tsx
│   ├── ui/                       # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── tabs.tsx
│   └── navbar.tsx                # Navigation bar
│
├── db/                           # Database
│   ├── schema.ts                 # Database schema (Drizzle)
│   └── index.ts                  # DB connection
│
├── lib/                          # Utilities & configs
│   ├── auth.ts                   # NextAuth configuration
│   ├── utils.ts                  # Helper functions
│   └── integrations/             # External integrations
│       ├── whatsapp.ts           # WhatsApp API
│       └── google-sheets.ts      # Google Sheets API
│
├── scripts/                      # Scripts
│   └── seed.ts                   # Database seeding
│
├── types/                        # TypeScript types
│   └── next-auth.d.ts            # NextAuth type extensions
│
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── drizzle.config.ts             # Drizzle configuration
├── middleware.ts                 # Next.js middleware (auth)
├── next.config.mjs               # Next.js configuration
├── package.json                  # Dependencies
├── postcss.config.mjs            # PostCSS config
├── tailwind.config.ts            # Tailwind config
├── tsconfig.json                 # TypeScript config
├── vercel.json                   # Vercel deployment config
│
└── Documentation/
    ├── README.md                 # Quick start guide
    ├── SETUP.md                  # Detailed setup instructions
    ├── DEPLOYMENT_GUIDE.md       # Vercel deployment guide
    └── PROJECT_SUMMARY.md        # This file
```

---

## 🗄️ Database Schema

### Users Table
```typescript
{
  id: serial (primary key)
  email: text (unique)
  password: text (hashed)
  name: text
  role: enum ('admin', 'affiliate')
  phone: text?
  bankName: text?
  bankAccount: text?
  commissionBalance: decimal (default: 0.00)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Desserts Table
```typescript
{
  id: serial (primary key)
  name: text
  description: text?
  price: decimal
  imageUrl: text?
  commissionRate: decimal (default: 10.00)
  isActive: integer (0 or 1)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Orders Table
```typescript
{
  id: serial (primary key)
  affiliateId: integer (foreign key → users)
  dessertId: integer (foreign key → desserts)
  quantity: integer
  totalPrice: decimal
  commissionAmount: decimal
  customerName: text
  customerPhone: text
  customerAddress: text?
  notes: text?
  status: enum ('pending', 'accepted', 'rejected')
  submittedAt: timestamp
  processedAt: timestamp?
  processedBy: integer? (foreign key → users)
}
```

### Withdrawals Table
```typescript
{
  id: serial (primary key)
  affiliateId: integer (foreign key → users)
  amount: decimal
  bankName: text
  bankAccount: text
  accountHolder: text
  status: enum ('pending', 'accepted', 'rejected')
  requestedAt: timestamp
  processedAt: timestamp?
  processedBy: integer? (foreign key → users)
  notes: text?
}
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout

### Desserts
- `GET /api/desserts` - Get all active desserts
- `POST /api/desserts` - Create dessert (admin only)
- `PUT /api/desserts/[id]` - Update dessert (admin only)
- `DELETE /api/desserts/[id]` - Delete dessert (admin only)

### Orders
- `GET /api/orders` - Get orders (filtered by role)
- `POST /api/orders` - Submit order (affiliate)
- `PATCH /api/orders/[id]` - Update order status (admin only)

### Withdrawals
- `GET /api/withdrawals` - Get withdrawals (filtered by role)
- `POST /api/withdrawals` - Request withdrawal (affiliate)
- `PATCH /api/withdrawals/[id]` - Process withdrawal (admin only)

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile

---

## 🔐 Authentication Flow

1. User enters email & password di login page
2. Credentials validated via NextAuth
3. Password compared dengan bcrypt hash
4. JWT token generated dengan user role
5. Session stored dengan user info
6. Middleware protects admin & affiliate routes
7. Redirect based on role (admin → /admin, affiliate → /affiliate)

---

## 💰 Commission Flow

1. **Affiliate submits order:**
   - Select dessert
   - Enter customer details
   - Commission calculated: `totalPrice × commissionRate / 100`
   - Order created dengan status "pending"

2. **Notifications sent:**
   - WhatsApp notification (if configured)
   - Google Sheets log (if configured)

3. **Admin reviews:**
   - View order details
   - Accept atau reject

4. **Upon acceptance:**
   - Order status → "accepted"
   - Commission credited: `affiliateBalance += commissionAmount`
   - Affiliate can see updated balance

5. **Withdrawal request:**
   - Affiliate requests withdrawal (min RM10)
   - Admin approves
   - Balance deducted: `affiliateBalance -= withdrawalAmount`

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env dengan your credentials

# Push database schema
npm run db:push

# Seed initial data
npm run seed

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 🌐 Environment Variables

### Required
```env
DATABASE_URL="postgresql://..."           # Neon database
AUTH_SECRET="random-secret-key"           # Auth encryption key
NEXTAUTH_URL="http://localhost:3000"      # App URL
```

### Optional (Integrations)
```env
WHATSAPP_API_URL=""                       # WhatsApp API endpoint
WHATSAPP_API_TOKEN=""                     # WhatsApp API token
WHATSAPP_PHONE_NUMBER=""                  # Target phone number

GOOGLE_SHEETS_PRIVATE_KEY=""              # Service account key
GOOGLE_SHEETS_CLIENT_EMAIL=""             # Service account email
GOOGLE_SHEETS_SPREADSHEET_ID=""           # Spreadsheet ID
```

---

## 👤 Default Users (Seeded)

### Admin
- Email: `admin@lodes.com`
- Password: `admin123`
- Role: Admin

### Affiliate
- Email: `affiliate@lodes.com`
- Password: `affiliate123`
- Role: Affiliate

---

## 📱 Responsive Design

App fully responsive untuk:
- 📱 Mobile (< 768px)
- 💻 Tablet (768px - 1024px)
- 🖥️ Desktop (> 1024px)

TailwindCSS breakpoints:
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px
- `xl:` 1280px

---

## 🔒 Security Features

1. **Password Hashing** - bcryptjs dengan salt rounds
2. **JWT Authentication** - Secure token-based auth
3. **Role-Based Access** - Admin vs Affiliate permissions
4. **SQL Injection Protection** - Drizzle ORM parameterized queries
5. **HTTPS** - Enforced on Vercel
6. **Environment Variables** - Sensitive data not in code

---

## 🎨 UI/UX Features

1. **Clean Design** - Modern, minimal interface
2. **Color Scheme** - Orange/primary theme untuk dessert business
3. **Status Badges** - Visual indicators untuk order/withdrawal status
4. **Loading States** - Feedback during async operations
5. **Error Handling** - User-friendly error messages
6. **Form Validation** - Input validation dengan helpful hints

---

## 🧪 Testing Checklist

### Admin Dashboard
- [ ] Login sebagai admin
- [ ] Add new dessert
- [ ] Edit dessert
- [ ] Delete dessert
- [ ] View pending orders
- [ ] Accept order
- [ ] Reject order
- [ ] View withdrawal requests
- [ ] Approve withdrawal
- [ ] Reject withdrawal dengan notes

### Affiliate Dashboard
- [ ] Login sebagai affiliate
- [ ] View commission balance
- [ ] Browse desserts
- [ ] Submit order
- [ ] View order history
- [ ] Check order status
- [ ] Request withdrawal
- [ ] View withdrawal status
- [ ] Update bank details

---

## 📊 Performance Considerations

1. **Database Queries**
   - Indexed foreign keys
   - Efficient joins dengan Drizzle relations
   - Connection pooling via Neon

2. **API Optimization**
   - Server-side rendering untuk initial page loads
   - Client-side data fetching untuk updates
   - Minimal data transfer

3. **Image Optimization**
   - Next.js Image component (when using next/image)
   - External URL support untuk flexibility

4. **Caching**
   - Static generation where possible
   - API route caching strategy

---

## 🔄 Future Enhancements (Optional)

1. **Features:**
   - Multi-product order submission
   - Order history export (CSV/PDF)
   - Performance analytics dashboard
   - Push notifications
   - SMS notifications
   - Email notifications

2. **Technical:**
   - Unit tests (Jest)
   - E2E tests (Playwright)
   - API rate limiting
   - Image upload to CDN
   - Real-time updates (WebSockets)

3. **Business:**
   - Referral system
   - Tiered commission rates
   - Loyalty program
   - Promo codes/discounts

---

## 📞 Support & Maintenance

### Monitoring
- Vercel Analytics untuk performance
- Neon monitoring untuk database
- Error tracking (Sentry optional)

### Backups
- Neon automatic backups
- Git version control
- Regular database exports

### Updates
- Keep dependencies updated
- Security patches
- Feature releases

---

## 📝 License

This project is open source and available for personal/commercial use.

---

## 🙏 Credits

Built with:
- Next.js
- React
- TypeScript
- TailwindCSS
- Drizzle ORM
- Neon Database
- NextAuth
- Vercel

---

**Version:** 1.0.0  
**Last Updated:** 2025-11-24  
**Author:** Lodes Development Team

---

🍰 **Selamat menggunakan Lodes App!** 🎉
