# Nailchemist

Nailchemist is a full-stack beauty salon loyalty, appointment booking, and payment management application.

## Stack

- Frontend: HTML, CSS, JavaScript
- Template engine: EJS
- Backend: Node.js and Express.js
- Database: MySQL
- Animation: GSAP
- Customer auth: Google OAuth
- Admin auth: Email and password
- Payments: Razorpay

## Local Setup

1. Install dependencies.

   ```bash
   cd beauty-loyalty-app
   npm install
   ```

2. Create the database and seed sample data.

   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p < database/seeds.sql
   ```

3. Create your environment file.

   ```bash
   cp .env.example .env
   ```

4. Fill `.env` with your MySQL, Google OAuth, session, and admin values.

   For local development, keep the app URL as:

   ```text
   APP_BASE_URL=http://localhost:3000
   ```

   Google OAuth uses `APP_BASE_URL` plus `/auth/google/callback` as the callback URL. Do not set a separate `GOOGLE_CALLBACK_URL`.

   Admin login uses `ADMIN_EMAIL` and `ADMIN_PASSWORD` for local development. Use `ADMIN_PASSWORD_HASH` in production.

5. Start the app.

   ```bash
   npm run dev
   ```

   Open:

   ```text
   http://localhost:3000
   ```

## Railway or Temporary Public Deployment

The app is prepared for Railway with `npm start`, `process.env.PORT`, and a `0.0.0.0` listen host.

Set the app URL to the public origin before starting the server:

```text
APP_BASE_URL=https://YOUR-PUBLIC-DOMAIN
```

The Google redirect URI will be:

```text
https://YOUR-PUBLIC-DOMAIN/auth/google/callback
```

For Railway, provision a separate MySQL database and set:

```text
NODE_ENV=production
PORT=<Railway provides this>
APP_BASE_URL=https://YOUR-RAILWAY-DOMAIN
DB_HOST=<Railway MySQL host>
DB_PORT=<Railway MySQL port>
DB_USER=<Railway MySQL user>
DB_PASSWORD=<Railway MySQL password>
DB_NAME=<Railway MySQL database>
GOOGLE_CLIENT_ID=<Google OAuth client ID>
GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
SESSION_SECRET=<long random value>
SESSION_STORE=mysql
ADMIN_EMAIL=<admin email>
ADMIN_PASSWORD_HASH=<bcrypt hash>
```

Temporary Cloudflare Tunnel command example:

```bash
cloudflared.exe tunnel --protocol http2 --url http://localhost:3000
```

## Admin 

Default local development fallback values if no admin variables are set:

```text
Email: admin@nailchemist.local
Password: Admin@12345
```

## Notes

- Visits are not created during booking or payment.
- Admin records a visit only after the customer attends the boutique.
- Services and rewards come from MySQL, not hardcoded page data.
- Set `SESSION_STORE=mysql` in production to use the MySQL session store.
- Run `database/schema.sql` against the Railway MySQL database before production use.
- Run `database/seeds.sql` only if the production database should start with the sample services and rewards.
- Razorpay appointment persistence happens only after signature verification succeeds.
- Razorpay credentials are optional until Razorpay is configured. Missing keys disable payment creation instead of crashing the app.
