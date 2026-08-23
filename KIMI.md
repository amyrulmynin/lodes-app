# Lodes App — KIMI Project Guide

> Fail ini dibaca automatik oleh Kimi Code. Ikut konteks & peraturan di bawah bila bekerja pada projek ini.

## Apa projek ini
Platform perniagaan dessert (Bahasa Melayu UI) untuk admin menguruskan bisnes secara langsung. Termasuk AI insights, Telegram bot, QR payment (DuitNow), live delivery tracking, pengurusan kewangan (duit masuk/keluar), rekod belian barang, order kepada supplier, gaji founder, dan rekod agent (dropship/pembeli).

## Tech Stack
- **Next.js 14** (App Router) + React 18 + TypeScript
- **TailwindCSS** + lucide-react
- **Neon PostgreSQL** (production) + **Drizzle ORM**; SQLite fallback untuk local dev (`db/index.ts` auto-switch ikut `DATABASE_URL`)
- **NextAuth v5** (credentials + JWT). Role: `admin` sahaja
- **jsPDF** (PDF invoice), **recharts** (dashboard), **leaflet** (map), **qrcode**

## Struktur Penting
```
app/
  track/[token]/          - tracking order + live map
  feedback/[token]/       - borang review per order
  review/                 - borang review manual (statik)
  drive/[token]/          - mod driver (GPS + bukti gambar)
  admin/                  - dashboard + managers (sidebar layout)
    cash-flow/            - duit masuk/keluar
    purchases/            - rekod belian barang
    supplier-orders/      - order kepada supplier
    salary/               - gaji founder
    suppliers/            - rekod supplier
    agents/               - rekod agent
  api/
    public/               - orders, payment, track, feedback, reviews
    admin/                - stats, integrations, stock, ai-insights, reviews, agents, suppliers, supplier-orders, purchases, cash-flow, salary
    webhooks/             - mudahpay, telegram
components/
  admin/                  - dashboard, managers, integrations, stock, ai-insights
  public/                 - shop, location-picker, live-delivery-map, driver-map
lib/
  integrations/           - config, ai (9router), telegram, mudahpay, whatsapp
  crypto.ts               - AES-256-GCM untuk API secrets dalam DB
db/
  schema.ts               - Postgres (sumber utama)
  schema.sqlite.ts        - cermin SQLite (KEKALKAN seirama)
```

## Database (jadual utama)
users, desserts, agents, suppliers, orders, supplierOrders, supplierOrderItems, purchases, expenses, founderSalaries, cashFlow, reviews, paymentSettings, integrationSettings, ingredients, stockMovements, deliveryLocations.

**orders** ada: paymentMethod (enum online|cod), paymentStatus, latitude/longitude/locationAccuracy, trackingToken, driverToken, deliveryProofUrl, feedbackToken.

## Integrasi (config dalam Admin > Integrations, disimpan encrypted)
- **AI** — 9router `https://bakdmy-9r.hf.space/v1`, model `cbcn/kimi-k3` (OpenAI-compatible). Nota: model reasoning — guna `max_tokens >= 2000` atau jawapan kosong. Guna untuk insights + OCR resit (vision).
- **Telegram** — Bot API. Notifikasi (order/review/stok rendah) + webhook terima gambar resit → AI OCR → restock automatik.
- **MudahPay** — DuitNow QR. Auth `x-api-key`, jumlah dalam **sen**, webhook HMAC (`X-MudahPay-Signature`). Checkout auto-QR bila enabled, else upload resit manual.

## Peraturan Penting (WAJIB ikut)
1. **Jangan hardcode secrets.** Semua dalam `integration_settings` (encrypted) atau env. Fallback: DB → env.
2. **Aliran status order:** `pending → accepted → out_for_delivery → delivered` (+ `rejected`).
3. **Cash flow** — setiap order direkod sebagai `cash_in` dalam jadual `cash_flow` secara automatik.
4. **Emoji dalam kod** — guna unicode escape (`\u2B50`, `\u{1F370}`). JANGAN tulis literal emoji — PowerShell rosakkan encoding fail.
5. **Endpoint public** — tiada auth tapi guna token (tracking/driver/feedback token). **Endpoint admin** — WAJIB semak `session.user.role === "admin"`.
6. **middleware.ts** — cookie check sahaja (edge-safe, JANGAN import db/auth). Validasi penuh dalam page/API.
7. **Fail dengan emoji** — guna Write tool atau UTF8Encoding. `Set-Content` PowerShell tulis UTF-16 (rosak).
8. Bila ubah schema, kemas kini **kedua-dua** `schema.ts` dan `schema.sqlite.ts`, kemudian migrate Neon.

## Auth
- Login di `/login`. Middleware lindungi `/admin/*`, `/invoices`, `/transactions`.
- Admin layout dikongsi: `components/admin/admin-page-shell.tsx`.
