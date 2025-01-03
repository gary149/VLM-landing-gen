import puppeteer from "puppeteer";

export async function takeScreenshot(htmlString: string, outputPath: string) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 60000 // Increase timeout to 60 seconds
    });
    
    const page = await browser.newPage();
    
    // Handle failed resources
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error));
    page.on('requestfailed', request => 
      console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText)
    );

    // Inject Tailwind CSS (Precompiled)
    const htmlWithTailwind = `
      <html>
        <head>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          ${htmlString}
        </body>
      </html>
    `;

    // Set a longer timeout for page operations
    await page.setDefaultNavigationTimeout(60000);
    await page.setDefaultTimeout(60000);

    // Wait for network to be idle before taking screenshot
    await page.setContent(htmlWithTailwind, { 
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 60000 
    });

    // Set viewport size (adjust as needed)
    await page.setViewport({ width: 1280, height: 800 });

    // Take screenshot
    await page.screenshot({ 
      path: outputPath, 
      fullPage: true,
      timeout: 60000
    });

    console.log(`Screenshot saved to ${outputPath}`);
  } catch (error) {
    console.error("Error taking screenshot:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
