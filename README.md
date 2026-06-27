# FX Convert — Currency Converter

A full-stack live currency converter with React frontend and Node.js/Express/MongoDB backend.

![Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue) ![Stack](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green) ![DB](https://img.shields.io/badge/Database-MongoDB-brightgreen)

## Features

- **Live Exchange Rates** — fetches from [Frankfurter API](https://www.frankfurter.app/), cached server-side for 60 seconds
- **18 Currencies** — USD, EUR, GBP, PKR, AED, SAR, JPY, INR, CAD, AUD, CHF, CNY, SGD, MYR, TRY, KWD, QAR, BHD
- **JWT Authentication** — secure signup/login per user
- **Favorite Pairs** — star any currency pair; saved to MongoDB and restored on login
- **Conversion History** — last 20 saved conversions with timestamps
- **Rate History Chart** — 7 / 14 / 30-day bezier line chart with open, high, low, and % change stats
- **Compare All** — converts your amount into all 18 currencies at once, sorted by value
- **Live Ticker** — animated scrolling ticker showing popular pairs at the top
- **Swap Button** — instantly swap From/To currencies
- **Copy to Clipboard** — one-click copy of the converted result

## Tech Stack

| Layer     | Technology                                |
|-----------|-------------------------------------------|
| Frontend  | React 18, Vite, React Router v6, Axios    |
| Backend   | Node.js, Express.js, node-fetch           |
| Database  | MongoDB, Mongoose                         |
| Auth      | JWT, bcryptjs                             |
| Rates API | Frankfurter (free, no API key needed)     |

## Project Structure

```
currency-converter/
├── backend/
│   ├── models/
│   │   ├── User.js         # username, email, password (hashed)
│   │   ├── Favorite.js     # user ref, from, to (unique per user pair)
│   │   └── Conversion.js   # user ref, from, to, amount, result, rate
│   ├── routes/
│   │   ├── auth.js         # POST /signup, POST /login
│   │   ├── favorites.js    # GET /, POST / (toggle)
│   │   ├── history.js      # GET / (last 20), POST / (save)
│   │   └── rates.js        # GET /latest, GET /history (Frankfurter proxy)
│   ├── middleware/
│   │   └── auth.js         # JWT verification middleware
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

- Node.js 18+
- MongoDB running locally (`mongod`)

### 1. Backend

```bash
cd backend
npm install
# Edit .env if needed (default: mongodb://localhost:27017/fxconvert, port 5002)
npm start
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5174](http://localhost:5174) — the Vite dev server proxies `/api` requests to the backend on port `5002`.

## API Endpoints

| Method | Endpoint               | Description                            | Auth |
|--------|------------------------|----------------------------------------|------|
| POST   | `/api/auth/signup`     | Create account, returns JWT            | No   |
| POST   | `/api/auth/login`      | Login, returns JWT                     | No   |
| GET    | `/api/rates/latest`    | Latest rates (60s server-side cache)   | Yes  |
| GET    | `/api/rates/history`   | Historical rates via Frankfurter       | Yes  |
| GET    | `/api/favorites`       | Get user's saved favorite pairs        | Yes  |
| POST   | `/api/favorites`       | Toggle a favorite pair (add/remove)    | Yes  |
| GET    | `/api/history`         | Last 20 saved conversions              | Yes  |
| POST   | `/api/history`         | Save a conversion                      | Yes  |

## Environment Variables

```env
MONGO_URI=mongodb://localhost:27017/fxconvert
JWT_SECRET=your-secret-key
PORT=5002
```

## Supported Currencies

| Code | Currency         | Code | Currency        |
|------|-----------------|------|-----------------|
| USD  | US Dollar        | SGD  | Singapore Dollar |
| EUR  | Euro             | MYR  | Malaysian Ringgit |
| GBP  | British Pound    | TRY  | Turkish Lira    |
| PKR  | Pakistani Rupee  | KWD  | Kuwaiti Dinar   |
| AED  | UAE Dirham       | QAR  | Qatari Riyal    |
| SAR  | Saudi Riyal      | BHD  | Bahraini Dinar  |
| CAD  | Canadian Dollar  | JPY  | Japanese Yen    |
| AUD  | Australian Dollar| CHF  | Swiss Franc     |
| INR  | Indian Rupee     | CNY  | Chinese Yuan    |

## Author

**Anisa Mahmood** — CS Student, University of Gujrat
