# Legal Metrology Compliance Checker — Backend

**SIH problem statement:** Automated Compliance Checker for Legal Metrology Declarations on E-Commerce Platforms (Ministry of Consumer Affairs, Food & Public Distribution).

A rule-based backend API that checks whether a product listing declares everything required under India's Legal Metrology (Packaged Commodities) Rules — net quantity, MRP, manufacturer details, manufacture date, consumer care contact, unit sale price, and country of origin (if imported).

No ML, no frontend required — pure Node + Express + MongoDB.

## Stack

- Node.js + Express — REST API
- MongoDB + Mongoose — stores submitted listings and their compliance results
- Plain JS rule engine (`utils/checkCompliance.js`) — the core logic

## Project structure

```
legal-metrology-checker/
├── server.js                  # entry point
├── models/Listing.js           # Mongoose schema
├── routes/listingRoutes.js     # API routes
├── utils/checkCompliance.js    # rule engine (the core logic)
├── utils/checkCompliance.test.js # standalone logic test, no DB needed
├── .env.example
└── package.json
```

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Set up MongoDB (pick one):
   - **Local:** install MongoDB Community Server and run `mongod`. Default connection string already works.
   - **Cloud (recommended, free, zero install):** create a free cluster at MongoDB Atlas, get your connection string.

3. Copy `.env.example` to `.env` and fill in your `MONGODB_URI`:
   ```
   cp .env.example .env
   ```

4. Start the server:
   ```
   npm start
   ```
   You should see:
   ```
   MongoDB connected: ...
   Server running on http://localhost:5000
   ```

## Quick sanity check (no DB needed)

To confirm the rule engine itself works, without touching the database at all:
```
npm run test:logic
```
This runs a compliant and a violating sample listing through `checkCompliance()` and prints the results.

## API Endpoints

### `GET /health`
Returns server + DB connection status.

### `POST /api/check-listing`
Body: a single listing object. Example:
```json
{
  "productTitle": "Basmati Rice 1kg",
  "platform": "Amazon",
  "netQuantity": "1 kg",
  "mrp": 199,
  "mrpInclusiveOfTaxes": true,
  "manufacturerName": "XYZ Foods Ltd",
  "manufacturerAddress": "Industrial Estate, Alwar, Rajasthan",
  "manufactureDate": "05/2026",
  "consumerCare": { "email": "support@xyzfoods.com" },
  "isImported": false,
  "unitSalePrice": 199
}
```
Response: `{ id, productTitle, platform, compliant, violations, checkedAt }`

### `POST /api/check-batch`
Body: `{ "listings": [ {...}, {...} ] }` — checks multiple listings at once.
Response: `{ summary: { total, compliant, nonCompliant }, results: [...] }`

### `GET /api/history`
Query params (all optional): `?compliant=true|false`, `?platform=Amazon`, `?limit=20`
Returns past checks, most recent first.

### `GET /api/history/:id`
Fetch one past check by its Mongo `_id`.

## Field reference (what the rule engine checks)

| Field              | Type                          | Rule                                                |
|--------------------|-------------------------------|------------------------------------------------------|
| `netQuantity`      | string, e.g. `"500 g"`        | must have a number + recognised unit (g/kg/ml/l/pcs)|
| `mrp`              | number or numeric string      | must be present and > 0                             |
| `mrpInclusiveOfTaxes` | boolean                    | should not be explicitly `false`                    |
| `manufacturerName` | string                        | required                                            |
| `manufacturerAddress` | string                     | required                                            |
| `manufactureDate`  | string, `"MM/YYYY"` or full date | required, must parse                            |
| `consumerCare`     | `{ email, phone }`            | at least one valid email or phone required          |
| `isImported`       | boolean                       | if `true`, `countryOfOrigin` becomes required        |
| `unitSalePrice`    | number                        | required                                            |

## Extending this later

- Swap the rule engine's regex checks for OCR-extracted text from package images.
- Add a `/api/check-url` endpoint that scrapes a live product page before checking.
- Add authentication + per-seller dashboards.
- Add a thin frontend (single HTML form or React page) that POSTs to `/api/check-listing`.
