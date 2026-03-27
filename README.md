# Nellis Auction Order Scraper

Logs into Nellis Auction, visits each order receipt page, extracts item details, and appends rows to a Google Sheet — one row per item.

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/tredfoot/nellis-scraper.git
cd nellis-scraper
```

### 2. Install dependencies

```bash
npm install
npx playwright install chromium
```

### 3. Set up your environment variables

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

### 4. Add your Google service account key

Download `service-account-key.json` from Google Cloud and place it in the project root. See **Google Sheets API Setup** below if you haven't done this yet.

### 5. Run it

```bash
node index.js
```

---

## Google Sheets API Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → enable the **Google Sheets API**
3. Go to **IAM & Admin → Service Accounts** → create a service account
4. Create a JSON key → download as `service-account-key.json` → place it in this folder
5. Open your Google Sheet → **Share** → paste the service account email (looks like `name@project.iam.gserviceaccount.com`) → give it **Editor** access

---

## Configuration

Open **`config.js`** to update CSS selectors if the site changes. These are not secrets so they live in the config file directly.

**Finding CSS selectors:** Open the site in Chrome, right-click the element you want → **Inspect** → right-click the highlighted HTML → **Copy → Copy selector**.

---

## Tips

- To watch the browser while debugging, set `HEADLESS=false` in your `.env`
- **Login redirect fails?** Try replacing `waitForLoadState` with `page.waitForSelector('some-element-on-dashboard')` after clicking login
- **Orders use infinite scroll?** Add scroll logic before collecting `orderLinks`
- **Pagination?** Ask Claude to add a paginated version
- **Run on a schedule?** Use `cron` (Linux/Mac) or Task Scheduler (Windows), or deploy to a small VPS
