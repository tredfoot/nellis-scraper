# Order Scraper

Logs into a website, visits each order detail page, extracts fields, and appends rows to a Google Sheet.

---

## Setup

### 1. Install dependencies

```bash
npm install
npx playwright install chromium
```

### 2. Set up your environment variables

```bash
cp .env.example .env
```

Open **`.env`** and fill in your values:

| Variable | What to put |
|---|---|
| `SITE_LOGIN_URL` | Full URL of the login page |
| `SITE_ORDERS_URL` | Full URL of the orders list page |
| `SITE_USERNAME` / `SITE_PASSWORD` | Your login credentials |
| `GOOGLE_SPREADSHEET_ID` | The long ID from your Google Sheet URL |
| `GOOGLE_SHEET_NAME` | The tab name (default: `Orders`) |
| `GOOGLE_KEY_FILE` | Path to your service account JSON (default: `./service-account-key.json`) |

> `.env` and `service-account-key.json` are both in `.gitignore` — they will never be committed to git.

### 3. Update CSS selectors in config.js

Open **`config.js`** and update the `selectors` and `fields` sections to match your site. These are not secrets so they live in the config file directly.

**Finding CSS selectors:** Open the site in Chrome, right-click the element you want → **Inspect** → right-click the highlighted HTML → **Copy → Copy selector**.

---

## Google Sheets API Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → enable the **Google Sheets API**
3. Go to **IAM & Admin → Service Accounts** → create a service account
4. Create a JSON key → download as `service-account-key.json` → place it in this folder
5. Open your Google Sheet → **Share** → paste the service account email (looks like `name@project.iam.gserviceaccount.com`) → give it **Editor** access

---

## Run

```bash
node index.js
```

To watch the browser while debugging, set `HEADLESS=false` in your `.env`.

---

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: order scraper agent"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

`.env` and `service-account-key.json` are excluded by `.gitignore` automatically. Teammates clone the repo and run `cp .env.example .env` to get started.

---

## Tips

- **Login redirect fails?** Try replacing `waitForNavigation` with `page.waitForSelector('some-element-on-dashboard')` after clicking login.
- **Orders use infinite scroll?** Add scroll logic before collecting `orderLinks` — ask Claude to add that if needed.
- **Pagination?** Same — ask for a paginated version.
- **Run on a schedule?** Use `cron` (Linux/Mac) or Task Scheduler (Windows), or deploy to a small VPS.
