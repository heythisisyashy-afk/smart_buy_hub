# SmartBuy Hub — setup guide

This starter store uses Google Apps Script to serve the website and write orders to a Google Sheet. It includes a responsive catalogue, product search, category filter, cart, order form, and optional WhatsApp follow-up.

## Files
- `Code.gs` — server-side product catalogue, order validation, and Google Sheets writing.
- `Index.html` — storefront, search/filter, cart, and checkout UI.
- `SETUP.md` — this guide.

## Setup (recommended)
1. Create a new Google Sheet named **SmartBuy Hub — Orders** at https://sheets.google.com.
2. In that Sheet, open **Extensions → Apps Script**. This links the script to the spreadsheet.
3. In the Apps Script editor, rename the default script file to `Code.gs` (or paste the supplied `Code.gs` into it).
4. Click **+ → HTML**, name the file exactly `Index`, and paste the contents of `Index.html`.
5. Save the project. In **Project Settings**, confirm the timezone you want for order timestamps.
6. Run `getStoreData` once from the editor if asked, then authorize the script. If asked to authorize spreadsheet access, review and approve it.
7. Select **Deploy → New deployment**. Click the gear/type selector and choose **Web app**.
8. Set **Execute as** to **Me**. Set access to **Anyone** if you want customers without Google accounts to order. Organization-managed Google accounts may restrict this option.
9. Click **Deploy**, complete any authorization steps, and copy the Web app URL ending in `/exec`.
10. Open that `/exec` URL to test the store. The `Orders` tab and header row are created when the first order is submitted.
11. Place a test order using your own test details. Confirm that a row appears in the `Orders` tab before sharing the link publicly.

## Add WhatsApp ordering
1. Open `Index.html` in Apps Script.
2. Find `const WHATSAPP_NUMBER = "";`.
3. Replace the empty string with your business number including country code, digits only. Example format for India: `919876543210`.
4. Save and deploy a **new version** of the web app: **Deploy → Manage deployments → Edit → New version → Deploy**.

WhatsApp is an optional follow-up after the order is saved. This starter does not automatically send messages or verify WhatsApp delivery.

## Edit products
Edit the `PRODUCTS` array near the top of `Code.gs`. Each product has `id`, `name`, `category`, `price`, `description`, and `emoji`. Use a unique ID for each product. Prices are calculated server-side so a browser edit cannot change the amount recorded in the sheet. Save, then deploy a new version.

For real product photos, replace the emoji artwork in `Index.html` with image URLs you own or have permission to use. Use reliable HTTPS image hosting.

## Export to Excel
In Google Sheets, use **File → Download → Microsoft Excel (.xlsx)**. Keep the Sheet private; customers should only use the web app URL.

## Important limits / production checklist
- The current payment choices are Cash on Delivery and “UPI (confirm with seller)”. This does **not** collect online payments. Add a payment gateway and server-side payment verification before accepting online payments.
- This starter does not calculate shipping fees, tax, stock availability, or discounts. Confirm these with customers before fulfilment.
- The order form collects personal information. Limit access to the Sheet, publish an appropriate privacy notice, and delete data when no longer needed.
- Anyone with the web app link may submit orders. Validation is included, but before broad public promotion consider spam protection, duplicate-order controls, stock management, and monitoring.
- Do not share the spreadsheet itself with customers and do not place private credentials in client-side HTML.
- Test the full flow before public launch. The sample catalogue and prices are placeholders, not verified inventory.
