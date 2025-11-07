/**
 * Puppeteer script to fetch icon URLs from Project Delta Wiki pages
 * 
 * Install dependencies:
 *   npm install --save-dev puppeteer @types/puppeteer
 * 
 * Usage:
 *   npm run fetch:wiki-icon <wiki-url>
 *   or
 *   tsx scripts/fetch-wiki-icon-puppeteer.ts <wiki-url>
 */

import puppeteer from 'puppeteer';

interface WikiIconResult {
  url: string;
  iconUrl: string | null;
  error?: string;
}

/**
 * Extract clean icon URL from full image URL
 */
function cleanIconUrl(fullUrl: string): string {
  // Remove query parameters (everything after .png)
  return fullUrl.split('/revision/')[0];
}

/**
 * Fetch icon URL from a single Wiki page
 */
async function fetchIconFromWikiPage(url: string): Promise<WikiIconResult> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    console.log(`📖 Loading: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for the Icon tab content to be visible
    await page.waitForSelector('.wds-tab__content.wds-is-current', { timeout: 10000 });

    // Extract icon URL
    const iconUrl = await page.evaluate(() => {
      // Find the active Icon tab content
      const activeTab = document.querySelector('.wds-tab__content.wds-is-current');
      
      if (!activeTab) {
        return null;
      }

      // Find the img tag inside the active tab
      const img = activeTab.querySelector('img.pi-image-thumbnail') as HTMLImageElement;
      
      if (!img) {
        return null;
      }

      // Get the src URL
      return img.src;
    });

    if (!iconUrl) {
      return {
        url,
        iconUrl: null,
        error: 'Icon image not found'
      };
    }

    const cleanUrl = cleanIconUrl(iconUrl);

    return {
      url,
      iconUrl: cleanUrl
    };

  } catch (error) {
    return {
      url,
      iconUrl: null,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    await browser.close();
  }
}

/**
 * Fetch icon URL from a single Wiki page (reusable browser version)
 */
async function fetchIconFromWikiPageWithBrowser(page: any, url: string): Promise<WikiIconResult> {
  try {
    console.log(`📖 Loading: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for page content to load (don't wait for specific tab, as some pages don't have tabs)
    await page.waitForSelector('body', { timeout: 10000 });

    // Extract icon URL - try multiple methods
    const iconUrl = await page.evaluate(() => {
      // @ts-ignore - Browser context, no TypeScript types
      // Method 1: Try to find icon in active tab (Icon tab)
      const activeTab = document.querySelector('.wds-tab__content.wds-is-current');
      if (activeTab) {
        const img = activeTab.querySelector('img.pi-image-thumbnail') as HTMLImageElement;
        if (img && img.src) {
          return img.src;
        }
      }

      // Method 2: Try to find icon in figure.pi-item.pi-image (for pages without tabs)
      const figure = document.querySelector('figure.pi-item.pi-image');
      if (figure) {
        const img = figure.querySelector('img.pi-image-thumbnail') as HTMLImageElement;
        if (img && img.src) {
          return img.src;
        }
      }

      // Method 3: Try to find any pi-image-thumbnail in the main content
      const mainContent = document.querySelector('.mw-parser-output, .page-content, main');
      if (mainContent) {
        const img = mainContent.querySelector('img.pi-image-thumbnail') as HTMLImageElement;
        if (img && img.src) {
          return img.src;
        }
      }

      // Method 4: Try to find image in first figure element
      const firstFigure = document.querySelector('figure');
      if (firstFigure) {
        const img = firstFigure.querySelector('img') as HTMLImageElement;
        if (img && img.src && !img.src.includes('logo') && !img.src.includes('placeholder')) {
          return img.src;
        }
      }

      return null;
    });

    if (!iconUrl) {
      return {
        url,
        iconUrl: null,
        error: 'Icon image not found'
      };
    }

    const cleanUrl = cleanIconUrl(iconUrl);

    return {
      url,
      iconUrl: cleanUrl
    };

  } catch (error) {
    return {
      url,
      iconUrl: null,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Fetch icon URLs from multiple Wiki pages (using single browser)
 */
async function fetchIconsFromMultiplePages(urls: string[]): Promise<WikiIconResult[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    const results: WikiIconResult[] = [];

    for (const url of urls) {
      console.log(`\n🔍 Processing: ${url}`);
      const result = await fetchIconFromWikiPageWithBrowser(page, url);
      results.push(result);
      
      if (result.iconUrl) {
        console.log(`✅ Found: ${result.iconUrl}`);
      } else {
        console.log(`❌ Error: ${result.error || 'Unknown error'}`);
      }

      // Small delay between requests to avoid rate limiting
      if (urls.indexOf(url) < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  } finally {
    await browser.close();
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: tsx scripts/fetch-wiki-icon-puppeteer.ts <wiki-url-1> [wiki-url-2] ...');
    console.log('\nExample:');
    console.log('  tsx scripts/fetch-wiki-icon-puppeteer.ts https://project-delta-a.fandom.com/wiki/AKMN_Handle');
    process.exit(1);
  }

  const urls = args;
  console.log(`\n🚀 Fetching icon URLs from ${urls.length} page(s)...\n`);

  const results = await fetchIconsFromMultiplePages(urls);

  // Print results
  console.log('\n📊 Results:');
  console.log('='.repeat(80));
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.url}`);
    if (result.iconUrl) {
      console.log(`   ✅ ${result.iconUrl}`);
    } else {
      console.log(`   ❌ ${result.error || 'Failed to fetch'}`);
    }
  });

  // Print JSON output for easy copying
  console.log('\n📋 JSON Output:');
  console.log(JSON.stringify(results, null, 2));

  // Print TypeScript object format
  console.log('\n💻 TypeScript Format:');
  results.forEach((result) => {
    if (result.iconUrl) {
      console.log(`  image: '${result.iconUrl}',`);
    }
  });
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { fetchIconFromWikiPage, fetchIconFromWikiPageWithBrowser, fetchIconsFromMultiplePages, cleanIconUrl };

