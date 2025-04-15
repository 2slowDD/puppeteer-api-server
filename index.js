const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.get('/analyze', async (req, res) => {
  const url = req.query.url;
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid or missing URL' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Linux; Android 7.0; Moto G4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36'
    );

    let totalBytes = 0;
    let requestCount = 0;

    page.on('response', async (res) => {
      const headers = res.headers();
      const length = parseInt(headers['content-length']) || 0;
      totalBytes += length;
      requestCount++;
    });

    await page.goto(url, { waitUntil: 'load', timeout: 30000 });

    await browser.close();

    return res.json({
      url,
      requests: requestCount,
      sizeKB: parseFloat((totalBytes / 1024).toFixed(2))
    });
  } catch (err) {
    if (browser) await browser.close();
    return res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Puppeteer API listening on port ${port}`);
});
