# MetroCheck

**A software solution for automated Legal Metrology compliance checking on e-commerce platforms — now with authentication.**

MetroCheck is a REST API that validates product listings against India's Legal Metrology (Packaged Commodities) Rules, 2011 — the rules requiring every pre-packaged product sold online to declare net quantity, MRP, manufacturer details, manufacture date, consumer care contact, and more. It's built entirely as software: no physical device, sensor, or embedded component required.



## What it does

- User registration/login with JWT-based authentication
- Two user roles: **seller** (default) and **regulator**/**admin**
- Accepts a product listing (JSON) and validates it against 7 Legal Metrology rules
- Persists every check, tagged to the user who ran it, building a compliance audit trail
- Sellers can only see their own check history; regulators/admins can see everyone's — mirroring how a real compliance system would restrict access
- Supports single and batch listing checks

## Stack

- Node.js + Express (ES modules — `import`/`export` throughout, not `require`)
- MongoDB + Mongoose — persistence and audit history
- JWT (`jsonwebtoken`) + `bcryptjs` — authentication and password hashing
- Plain JS rule engine (`utils/checkCompliance.js`) — deterministic, no ML, so every violation is explainable

## Project structure

```
metrocheck/
├── server.js                     # entry point
├── models/
│   ├── User.js                    # user accounts, hashed passwords, role
│   └── Listing.js                 # a checked listing, tagged to its creator
├── middleware/
│   └── auth.js                    # requireAuth / requireRole JWT middleware
├── routes/
│   ├── authRoutes.js              # register / login
│   └── listingRoutes.js           # check-listing / check-batch / history (all protected)
├── utils/
│   ├── checkCompliance.js         # the rule engine (the core logic)
│   └── checkCompliance.test.js    # standalone logic test, no DB needed
├── .env.example
└── package.json
```

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Set up MongoDB (local `mongod`, or a free MongoDB Atlas cluster).

3. Copy `.env.example` to `.env` and fill in `MONGODB_URI` and `JWT_SECRET`:
   ```
   cp .env.example .env
   ```

4. Start the server:
   ```
   npm start
   ```

## Quick sanity check (no DB needed)

```
npm run test:logic
```

## Authentication flow

### `POST /api/auth/register`
```json
{ "name": "Asha", "email": "asha@example.com", "password": "atleast6chars", "role": "seller" }
```
`role` is optional and defaults to `"seller"`. Valid roles: `seller`, `regulator`, `admin`.
Returns a JWT `token` and the created `user`.

### `POST /api/auth/login`
```json
{ "email": "asha@example.com", "password": "atleast6chars" }
```
Returns a JWT `token` and the `user`.

### Using the token
Every listing endpoint requires the token in the `Authorization` header:
```
Authorization: Bearer <token>
```
In Postman: go to the request's **Authorization** tab → type **Bearer Token** → paste the token from a register/login response.

## Listing endpoints (all require a valid token)

### `POST /api/check-listing`
Body: a single listing object. Returns `{ id, productTitle, platform, compliant, violations, checkedAt }`.

### `POST /api/check-batch`
Body: `{ "listings": [ {...}, {...} ] }`. Returns a summary + per-item results.

### `GET /api/history`
Sellers see only their own past checks. Regulators/admins see everyone's.
Query params (optional): `?compliant=true|false`, `?platform=Amazon`, `?limit=20`.

### `GET /api/history/:id`
Sellers can only fetch their own listing checks (403 if they try someone else's); regulators/admins can fetch any.

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

- Add OCR to extract declarations directly from package images
- Add a `/api/check-url` endpoint that scrapes a live product page before checking
- Add a regulator-facing dashboard visualizing violation trends over time
- Add refresh tokens / token revocation for production-grade auth
- Add a thin frontend (single HTML form or React page) that logs in and hits `/api/check-listing`
