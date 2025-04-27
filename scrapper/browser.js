// browser.js
const puppeteer = require('puppeteer');

async function initBrowser() {
  return await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
}

async function openPage(browser, url) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
  return page;
}

module.exports = { initBrowser, openPage };