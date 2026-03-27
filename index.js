const { chromium } = require('playwright');
const { google } = require('googleapis');
const config = require('./config');

// ── Google Sheets ──────────────────────────────────────────────────────────────

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: config.google.serviceAccountKeyFile,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

async function appendRows(sheets, rows) {
  if (rows.length === 0) {
    console.log('No rows to append.');
    return;
  }
  await sheets.spreadsheets.values.append({
    spreadsheetId: config.google.spreadsheetId,
    range: `'${config.google.sheetName}'`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows },
  });
  console.log(`✅ Appended ${rows.length} row(s) to Google Sheet.`);
}

// ── Scraper ────────────────────────────────────────────────────────────────────

async function scrapeOrders() {
  const browser = await chromium.launch({ headless: config.headless });
  const page = await browser.newPage();
  const results = [];

  try {
    // 1. Log in
    console.log('🔐 Logging in...');
    await page.goto(config.site.loginUrl, { waitUntil: 'domcontentloaded' });
    await page.fill(config.site.selectors.usernameInput, config.site.username);
    await page.fill(config.site.selectors.passwordInput, config.site.password);
    await page.click(config.site.selectors.loginButton);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    console.log('✅ Logged in.');

    // 2. Navigate to orders list
    console.log('📋 Navigating to orders page: ' + config.site.ordersUrl);
    await page.goto(config.site.ordersUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('a[aria-label^="View details"]', { timeout: 10000 });

    // 3. Collect all order row links
    const orderLinks = await page.$$eval(
      'a[aria-label^="View details"]',
      links => links.map(l => l.getAttribute('href'))
    );
    console.log(`🔍 Found ${orderLinks.length} orders.`);

    // 4. Visit each order and extract fields
    for (let i = 0; i < orderLinks.length; i++) {
      const link = orderLinks[i];
      if (!link) continue;

      const url = link.startsWith('http') ? link : new URL(link, config.site.ordersUrl).href;
      console.log(`  [${i + 1}/${orderLinks.length}] Scraping: ${url}`);

      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      // Extract order-level fields (Order ID, Date, Total)
      const orderIdEls = await page.$$('p.text-body-lg');
      const orderId    = orderIdEls[0] ? (await orderIdEls[0].textContent()).replace('Receipt #', '').trim() : '';
      const date       = orderIdEls[1] ? (await orderIdEls[1].textContent()).replace('Date:', '').trim() : '';
      const total      = await page.$eval('td[data-title="Amount"]', el => el.textContent.trim()).catch(() => '');

      // Extract items — deduplicate by name in case the site renders the list twice
      const items = await page.$$eval(
        'div.flex.flex-col.gap-4 > div.grid',
        (grids) => {
          const seen = new Set();
          return grids.reduce((acc, grid) => {
            const name  = grid.querySelector('p.text-secondary')?.textContent.trim() || '';
            const price = grid.querySelector('div.justify-self-end p')?.textContent.trim() || '';
            if (name && !seen.has(name)) {
              seen.add(name);
              acc.push({ name, price });
            }
            return acc;
          }, []);
        }
      );

      if (items.length === 0) {
        results.push([orderId, date, '', '', total]);
      } else {
        for (const item of items) {
          const row = [orderId, date, item.name, item.price, total];
          console.log(`    Item row: ${JSON.stringify(row)}`);
          results.push(row);
        }
      }

      await page.waitForTimeout(config.delayBetweenOrdersMs);
    }
  } finally {
    await browser.close();
  }

  return results;
}

// ── Main ───────────────────────────────────────────────────────────────────────

(async () => {
  try {
    const sheets = await getSheetsClient();

    // Write header row if sheet is empty
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: config.google.spreadsheetId,
      range: `'${config.google.sheetName}'!A1`,
    });
    const isEmpty = !existing.data.values || existing.data.values.length === 0;
    if (isEmpty) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: config.google.spreadsheetId,
        range: `'${config.google.sheetName}'!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [['Order ID', 'Date', 'Product Name', 'Item Price', 'Order Total']] },
      });
      console.log('📝 Wrote header row.');
    }

    const rows = await scrapeOrders();
    console.log(`\n📊 Total rows scraped: ${rows.length}`);
    await appendRows(sheets, rows);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
