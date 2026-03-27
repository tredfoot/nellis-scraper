require('dotenv').config();

function require_env(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

module.exports = {
  headless: process.env.HEADLESS !== 'false',
  delayBetweenOrdersMs: parseInt(process.env.DELAY_MS || '800', 10),

  site: {
    loginUrl:  require_env('SITE_LOGIN_URL'),
    ordersUrl: require_env('SITE_ORDERS_URL'),
    username:  require_env('SITE_USERNAME'),
    password:  require_env('SITE_PASSWORD'),

    selectors: {
      usernameInput:    'input[name="email"]',
      passwordInput:    'input[name="password"]',
      loginButton:      'form#login button[type="submit"]',
      orderRow:         'a[aria-label^="View details"]',
      orderRowHrefAttr: 'href',
    },
  },

  fields: [
    // index: grab the Nth matching element (0-based), then clean the label prefix
    { label: 'Order ID',     selector: 'p.text-body-lg', index: 0, clean: 'Receipt #' },
    { label: 'Date',         selector: 'p.text-body-lg', index: 1, clean: 'Date:' },
    { label: 'Product Name', selector: 'p.text-secondary.text-left' },
    { label: 'Total',        selector: 'td[data-title="Amount"]' },
  ],

  google: {
    serviceAccountKeyFile: process.env.GOOGLE_KEY_FILE || './service-account-key.json',
    spreadsheetId: require_env('GOOGLE_SPREADSHEET_ID'),
    sheetName:     process.env.GOOGLE_SHEET_NAME || 'Orders',
  },
};
