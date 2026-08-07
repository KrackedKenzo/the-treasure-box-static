THE TREASURE BOX — Static Edition
=================================

This is the ENTIRE boutique running in the browser — no Python, no server,
no database, no installation. It is now split into three files:

   index.html   — the page structure
   styles.css   — all styling (navy & mint theme)
   app.js       — all functionality (shop, cart, checkout, admin)

Keep all three in the SAME folder — index.html loads the other two.

HOW TO USE IT
-------------
1. Double-click index.html — it opens in your web browser and just works.
   (Or drag it onto a browser window.) Keep styles.css and app.js beside it.

2. To put it online, upload all three files (index.html, styles.css, app.js)
   together to any static host:
   • Netlify Drop   → https://app.netlify.com/drop  (drag the file, done, free)
   • GitHub Pages, Cloudflare Pages, Vercel — all free
   • Any web hosting's public folder
   You get a real public URL in seconds, and it works on phones too.

ADMIN LOGIN
-----------
Click "Admin" in the top menu.
   E-mail:    csbizcircle18@gmail.com
   Password:  cstol89*

From the admin console you can:
   • Post a bag (name, brand, condition, price, stock, photos, description)
   • Edit or delete listings
   • See orders and change their status
   • Set a bank account (Payment settings) to offer bank transfer at checkout

SHOPPERS CAN
------------
   • Browse and search by brand
   • Filter, sort, add to cart
   • Register an account (name, age, phone, address, etc.)
   • Check out and "pay" by card (demo) or bank transfer
   • See their order history

IMPORTANT — HOW DATA IS STORED
------------------------------
Everything (your posted bags, accounts, orders) is saved in the browser's
local storage. That means:
   • Data stays on THIS browser/device. It persists when you close and
     reopen, but it is NOT shared between different devices or visitors.
   • If two people open the site online, each sees their own copy — this is
     a demo/prototype, not a shared live shop.
   • Clearing your browser data erases it.

If you want ONE real shared shop where every visitor sees the same products
and you receive real orders in a database, that's the full Flask version
(the-treasure-box.zip) hosted on PythonAnywhere. This static file is the
zero-setup, runs-anywhere version.

Card payments are simulated. Use any 16-digit number (e.g. 4242 4242 4242 4242);
numbers starting 0000 decline. Bank transfer shows the account you set and is
the one method where real money would move (bank-to-bank, outside the site).

Promo codes: WELCOME10 (10% off), TREASURE50 ($50 off orders over $500).
