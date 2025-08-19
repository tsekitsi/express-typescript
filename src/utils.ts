import { Builder, WebDriver } from 'selenium-webdriver'
import * as chrome from 'selenium-webdriver/chrome'

// Product monitoring configuration
const CHROME_PATH: string = '/Users/tseki/Downloads/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
const TARGET_URL: string = 'https://www.nyxcosmetics.com/on/demandware.store/Sites-nyxcosmetics-us-Site/en_US/CDSLazyload-product_availability?configid=pdpv3&data=BUN_063&id=availability&section=product&ajax=true'

export interface ProductMonitorConfig {
  checkInterval?: number
  chromePath?: string
  targetUrl?: string
  headless?: boolean
}

export class ProductMonitor {
  private readonly config: Required<ProductMonitorConfig>
  private intervalId: NodeJS.Timeout | null = null
  private isRunning: boolean = false

  constructor(config: ProductMonitorConfig = {}) {
    this.config = {
      checkInterval: config.checkInterval ?? 60000, // 1 minute default
      chromePath: config.chromePath ?? CHROME_PATH,
      targetUrl: config.targetUrl ?? TARGET_URL,
      headless: config.headless ?? false
    }
  }

  async checkProductAvailability(): Promise<boolean | null> {
    let driver: WebDriver | undefined

    try {
      console.log(`[${new Date().toISOString()}] Checking product availability...`)

      // Configure Chrome options
      const options = new chrome.Options()
      options.setChromeBinaryPath(this.config.chromePath)

      if (this.config.headless) {
        options.addArguments('--headless')
      }

      options.addArguments('--no-sandbox')
      options.addArguments('--disable-dev-shm-usage')

      // Create driver
      driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build()

      // Visit the page
      await driver.get(this.config.targetUrl)

      // Wait for page to fully load
      await driver.sleep(1000)

      // Check if the response body contains "out of stock"
      const isAvailable: boolean | null = await driver.executeScript(`
        const bodyText = document.body.textContent || document.body.innerText || '';
        return !bodyText.toLowerCase().includes('out of stock');
      `)

      console.log(`Product available: ${isAvailable !== null ? isAvailable.toString() : 'null'}`)
      return isAvailable
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Error checking availability: ${errorMessage}`)
      return null
    } finally {
      // Always close the browser
      if (driver !== undefined) {
        await driver.quit()
      }
    }
  }

  start(): void {
    if (this.isRunning) {
      console.log('Product monitor is already running')
      return
    }

    console.log('Starting product availability monitor...')
    console.log(`Checking every ${this.config.checkInterval / 1000} seconds`)

    this.isRunning = true

    // Run initial check
    void this.checkProductAvailability()

    // Set up interval for subsequent checks
    this.intervalId = setInterval(() => {
      void (async (): Promise<void> => {
        await this.checkProductAvailability()
      })()
    }, this.config.checkInterval)
  }

  stop(): void {
    if (!this.isRunning) {
      console.log('Product monitor is not running')
      return
    }

    console.log('Stopping product monitor...')

    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.isRunning = false
    console.log('Product monitor stopped')
  }

  getStatus(): { isRunning: boolean, checkInterval: number, targetUrl: string } {
    return {
      isRunning: this.isRunning,
      checkInterval: this.config.checkInterval,
      targetUrl: this.config.targetUrl
    }
  }
}
