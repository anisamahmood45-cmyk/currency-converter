# FX Convert — Currency Converter

A full-stack live currency and crypto converter with React frontend and Node.js/Express backend. No database installation required — data is stored in a local JSON file via lowdb.

![Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue) ![Stack](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green) ![DB](https://img.shields.io/badge/Database-lowdb%20(JSON%20file)-orange)

## Features

### Core Converter (No Login Needed)
- **Live Exchange Rates** — fetches from [Frankfurter API](https://www.frankfurter.app/), cached server-side for 60 seconds
- **18 Fiat Currencies** — USD, EUR, GBP, PKR, AED, SAR, JPY, INR, CAD, AUD, CHF, CNY, SGD, MYR, TRY, KWD, QAR, BHD
- **5 Cryptocurrencies** — BTC, ETH, USDT, BNB, SOL via [CoinGecko API](https://www.coingecko.com/)
- **Fee / Commission Calculator** — enter a % fee to see the result after deduction
- **Multi-Amount Table** — toggle a quick reference table showing 1, 5, 10, 50, 100, 500, 1000 units converted at once
- **Swap Button** — instantly swap From/To currencies
- **Copy to Clipboard** — one-click copy of the converted result
- **Rate History Chart** — 7 / 14 / 30-day bezier line chart with open, high, low, and % change stats (fiat pairs only)
- **Compare All** — converts your amount into all currencies at once, sorted by value; toggle to show/hide crypto
- **Live Ticker** — animated scrolling ticker showing popular pairs at the top
- **Quick Pairs** — one-click shortcuts for common pairs (USD→PKR, BTC→USD, etc.)
- **Mobile Responsive** — works on phones and tablets

### Account Features (Optional Login)
- **JWT Authentication** — secure signup/login
- **Favorite Pairs** — star any currency pair; saved to your account and restored on next login
- **Conversion History** — last 20 saved conversions with timestamps; tap "Save" after any conversion

## Tech Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Frontend   | React 18, Vite, React Router v6, Axios      |
| Backend    | Node.js, Express.js, node-fetch             |
| Database   | **lowdb v1** (JSON file, no install needed) |
| Auth       | JWT, bcryptjs                               |
| Fiat Rates | Frankfurter API (free, no API key)          |
| Crypto     | CoinGecko API (free, no API key)            |

## Project Structure

```
currency-converter/
├── backend/
│   ├── db.js              # lowdb setup → db.json (auto-created)
│   ├── routes/
│   │   ├── auth.js        # POST /signup, POST /login
│   │   ├── favorites.js   # GET /, POST / (toggle)
│   │   ├── history.js     # GET / (last 20), POST / (save)
│   │   └── rates.js       # GET /latest, GET /history, GET /crypto
│   ├── middleware/
│   │   └── auth.js        # JWT verification middleware
│   ├── server.js
│   └── .env
└── frontend/
    └── src/
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── SignupPage.jsx
        │   └── ConverterPage.jsx
        ├── components/
        │   └── Navbar.jsx
        └── App.jsx
```

## Getting Started

### Prerequisites

- Node.js 18+ (no database software required)

### 1. Backend

```bash
cd backend
npm install
npm start
```

Runs on **http://localhost:5002**. A `db.json` file is created automatically on first run.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5175** — the Vite dev server proxies `/api` requests to the backend on port `5002`.

> The converter works immediately without creating an account. Sign up only if you want to save favorites and history.

### Default `.env`

```env
JWT_SECRET=fxconvert-secret
PORT=5002
```

## API Endpoints

| Method | Endpoint             | Description                            | Auth |
|--------|----------------------|----------------------------------------|------|
| POST   | `/api/auth/signup`   | Create account, returns JWT            | No   |
| POST   | `/api/auth/login`    | Login, returns JWT                     | No   |
| GET    | `/api/rates/latest`  | Latest fiat rates (60s cache)          | No   |
| GET    | `/api/rates/crypto`  | Live crypto prices in USD (60s cache)  | No   |
| GET    | `/api/rates/history` | Historical rates via Frankfurter       | No   |
| GET    | `/api/favorites`     | Get user's saved favorite pairs        | Yes  |
| POST   | `/api/favorites`     | Toggle a favorite pair (add/remove)    | Yes  |
| GET    | `/api/history`       | Last 20 saved conversions              | Yes  |
| POST   | `/api/history`       | Save a conversion                      | Yes  |

## Supported Currencies

### Fiat (18 currencies)

| Code | Currency          | Code | Currency          |
|------|-------------------|------|-------------------|
| USD  | US Dollar         | SGD  | Singapore Dollar  |
| EUR  | Euro              | MYR  | Malaysian Ringgit |
| GBP  | British Pound     | TRY  | Turkish Lira      |
| PKR  | Pakistani Rupee   | KWD  | Kuwaiti Dinar     |
| AED  | UAE Dirham        | QAR  | Qatari Riyal      |
| SAR  | Saudi Riyal       | BHD  | Bahraini Dinar    |
| CAD  | Canadian Dollar   | JPY  | Japanese Yen      |
| AUD  | Australian Dollar | CHF  | Swiss Franc       |
| INR  | Indian Rupee      | CNY  | Chinese Yuan      |

### Crypto (5 currencies)

| Code | Currency  | Source    |
|------|-----------|-----------|
| BTC  | Bitcoin   | CoinGecko |
| ETH  | Ethereum  | CoinGecko |
| USDT | Tether    | CoinGecko |
| BNB  | BNB       | CoinGecko |
| SOL  | Solana    | CoinGecko |

## Author

**Anisa Mahmood** — CS Student, University of Gujrat
