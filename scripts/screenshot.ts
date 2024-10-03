import puppeteer from "puppeteer";

export async function takeScreenshot(htmlString: string, outputPath: string) {
  let browser;
  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();

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

    console.log(htmlWithTailwind);

    // Ensure the page waits for all resources to load
    await page.setContent(htmlWithTailwind, { waitUntil: "networkidle0" });

    // Set viewport size (adjust as needed)
    await page.setViewport({ width: 1280, height: 800 });

    // Optional: Wait for a specific element to ensure styles are applied
    // await page.waitForSelector('your-selector');

    // Take screenshot
    await page.screenshot({ path: outputPath, fullPage: true });

    console.log(`Screenshot saved to ${outputPath}`);
  } catch (error) {
    console.error("Error taking screenshot:", error);
    throw error; // Re-throw the error to be handled by the caller
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
