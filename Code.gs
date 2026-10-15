const STORE_NAME = "SmartBuy Hub";
const SPREADSHEET_ID = ""; // Optional: paste your Google Sheet ID here. Leave blank to use the script's linked spreadsheet.
const ORDERS_SHEET_NAME = "Orders";

// Edit these sample products. Prices are verified on the server when an order is submitted.
const PRODUCTS = [
  { id: "TSHIRT-001", name: "Classic Cotton T-Shirt", category: "Clothing", price: 399, description: "Everyday cotton comfort.", emoji: "👕" },
  { id: "SHIRT-001", name: "Casual Shirt", category: "Clothing", price: 699, description: "A versatile casual shirt.", emoji: "👔" },
  { id: "JEANS-001", name: "Denim Jeans", category: "Clothing", price: 999, description: "Classic everyday denim.", emoji: "👖" },
  { id: "EARBUD-001", name: "Wireless Earbuds", category: "Electronics", price: 1299, description: "Wireless audio for daily use.", emoji: "🎧" },
  { id: "CHARGER-001", name: "Fast Charging Adapter", category: "Electronics", price: 499, description: "Compact charging adapter.", emoji: "🔌" },
  { id: "CASE-001", name: "Mobile Phone Cover", category: "Accessories", price: 199, description: "Simple everyday phone protection.", emoji: "📱" }
];

function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle(STORE_NAME)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function getStoreData() {
  return {
    storeName: STORE_NAME,
    products: PRODUCTS
  };
}

function submitOrder(formData) {
  if (!formData || typeof formData !== "object") {
    throw new Error("Invalid order details. Please refresh the page and try again.");
  }

  const name = cleanText_(formData.name, 80);
  const phone = cleanText_(formData.phone, 20);
  const address = cleanText_(formData.address, 500);
  const paymentMethod = cleanText_(formData.paymentMethod, 30);
  const items = Array.isArray(formData.items) ? formData.items : [];

  if (name.length < 2) throw new Error("Please enter your full name.");
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) throw new Error("Please enter a valid mobile number.");
  if (address.length < 8) throw new Error("Please enter your complete delivery address.");
  if (!["Cash on Delivery", "UPI (confirm with seller)"].includes(paymentMethod)) {
    throw new Error("Please choose a valid payment option.");
  }
  if (items.length === 0 || items.length > 30) throw new Error("Your cart is empty or contains too many items.");

  // Never trust product prices sent by the browser. Recalculate from server-side catalogue.
  const productMap = {};
  PRODUCTS.forEach(p => productMap[p.id] = p);
  const orderItems = [];
  let total = 0;

  items.forEach(item => {
    const product = productMap[String(item.id || "")];
    const quantity = Number(item.quantity);
    if (!product) throw new Error("A product in your cart is no longer available. Please refresh your cart.");
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw new Error("Each product quantity must be between 1 and 20.");
    }
    const lineTotal = product.price * quantity;
    total += lineTotal;
    orderItems.push({
      id: product.id,
      name: product.name,
      category: product.category,
      quantity: quantity,
      price: product.price,
      lineTotal: lineTotal
    });
  });

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getOrdersSheet_();
    const orderId = "SBH-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss") + "-" + Math.floor(100 + Math.random() * 900);
    const orderDate = new Date();
    const itemSummary = orderItems.map(i => `${i.name} x ${i.quantity}`).join("; ");
    const categories = [...new Set(orderItems.map(i => i.category))].join(", ");
    const quantities = orderItems.map(i => `${i.name}: ${i.quantity}`).join("; ");
    const prices = orderItems.map(i => `${i.name}: ₹${i.price}`).join("; ");

    sheet.appendRow([
      orderId,
      orderDate,
      name,
      "'" + digits,
      address,
      itemSummary,
      categories,
      quantities,
      prices,
      total,
      paymentMethod,
      "Pending"
    ]);

    return {
      success: true,
      orderId: orderId,
      total: total,
      customerName: name,
      phone: digits,
      address: address,
      paymentMethod: paymentMethod,
      items: orderItems
    };
  } finally {
    lock.releaseLock();
  }
}

function getOrdersSheet_() {
  let spreadsheet;
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim()) {
    spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  } else {
    spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  }
  if (!spreadsheet) {
    throw new Error("No spreadsheet is connected. Open the Apps Script project from your Google Sheet, or set SPREADSHEET_ID in Code.gs.");
  }

  let sheet = spreadsheet.getSheetByName(ORDERS_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(ORDERS_SHEET_NAME);

  const headers = [
    "Order ID", "Order Date", "Customer Name", "Mobile Number",
    "Delivery Address", "Products", "Category", "Quantities",
    "Unit Prices", "Total Amount (INR)", "Payment Method", "Order Status"
  ];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.getRange("B:B").setNumberFormat("dd-mmm-yyyy hh:mm");
    sheet.getRange("J:J").setNumberFormat('"₹"#,##0.00');
  }
  return sheet;
}

function cleanText_(value, maxLength) {
  const text = String(value == null ? "" : value).replace(/[<>]/g, "").trim();
  return text.substring(0, maxLength);
}
