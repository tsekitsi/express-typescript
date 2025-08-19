/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/space-before-function-paren */
import { Builder, WebDriver } from 'selenium-webdriver'
import * as chrome from 'selenium-webdriver/chrome'

const CHROME_PATH: string = '/Users/tseki/Downloads/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
const TARGET_URL: string = 'https://www.nyxcosmetics.com/new/the-nicolandria-lip-combo/BUN_063.html'
const CHECK_INTERVAL: number = 60000 // 1 minute in milliseconds

async function checkProductAvailability(): Promise<void> {
  let driver: WebDriver | undefined

  try {
    console.log(`[${new Date().toISOString()}] Checking product availability...`)

    // Configure Chrome options
    const options = new chrome.Options()
    options.setChromeBinaryPath(CHROME_PATH)
    // options.addArguments('--headless') // Run in background
    options.addArguments('--no-sandbox')
    options.addArguments('--disable-dev-shm-usage')

    // Create driver
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build()

    // Visit the page
    await driver.get(TARGET_URL)

    // Wait for page to load and execute the availability check
    const isAvailable: boolean | null = await driver.executeScript(`
            const element = document.querySelector('.c-product-main');
            if (!element) return null;
            const analyticsData = element.getAttribute('data-analytics');
            if (!analyticsData) return null;
            const data = JSON.parse(analyticsData);
            return !(data.products[0].stock === 'out of stock');
        `)

    console.log(`Product available: ${isAvailable}`)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Error checking availability: ${errorMessage}`)
  } finally {
    // Always close the browser
    if (driver) {
      await driver.quit()
    }
  }
}

// Start monitoring
console.log('Starting product availability monitor...')
console.log(`Checking every ${CHECK_INTERVAL / 1000} seconds`)

// Run initial check
// eslint-disable-next-line @typescript-eslint/no-floating-promises
checkProductAvailability()

// Set up interval for subsequent checks
// eslint-disable-next-line @typescript-eslint/no-misused-promises
setInterval(checkProductAvailability, CHECK_INTERVAL)

// Handle graceful shutdown
process.on('SIGINT', (): void => {
  console.log('\nShutting down product monitor...')
  process.exit(0)
})
