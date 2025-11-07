/**
 * Script to fetch icon URLs for all items from the links JSON file
 * 
 * This script:
 * 1. Reads item links from wiki_item_links.json
 * 2. Fetches icon URL for each item
 * 3. Saves complete item data to item_list.json
 * 
 * Usage:
 *   tsx scripts/fetch-wiki-details.ts
 *   or
 *   npm run fetch:wiki-details
 */

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { fetchIconFromWikiPageWithBrowser, cleanIconUrl } from './fetch-wiki-icon-puppeteer';

interface ItemLink {
  name: string;
  url: string;
  category: string;
}

interface ItemLinksResult {
  // Weapons
  weapons: ItemLink[];
  // Weapon Components
  fronts: ItemLink[];
  handles: ItemLink[];
  stocks: ItemLink[];
  muzzles: ItemLink[];
  optics: ItemLink[];
  extras: ItemLink[];
  magazines: ItemLink[];
  // Wearables
  helmets: ItemLink[];
  visors: ItemLink[];
  chestRigs: ItemLink[];
  legArmor: ItemLink[];
  backpacks: ItemLink[];
  clothes: ItemLink[];
  masks: ItemLink[];
  gloves: ItemLink[];
  // Other
  equipment: ItemLink[];
  ammunition: ItemLink[];
  deployables: ItemLink[];
  consumables: ItemLink[];
  keys: ItemLink[];
  junk: ItemLink[];
}

interface ItemDetail {
  name: string;
  image: string;
  description: string;
  rarity: string;
  type: string;
  availability: string;
  npcBuyPrice: number | null;
  npcSellPrice: number | null;
  averagePrice: number;
  wikiUrl: string;
  category: string;
  compatibleWeapons?: string[];
}

/**
 * Load item links from JSON file
 */
function loadItemLinks(filePath: string): ItemLinksResult {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}\nPlease run 'npm run fetch:wiki-links' first.`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Load existing items from JSON file
 */
function loadExistingItems(filePath: string): ItemDetail[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    return data.itemList || [];
  } catch (error) {
    console.warn(`⚠️  Could not load existing items: ${error}`);
    return [];
  }
}

/**
 * Convert category name to ItemType
 */
function categoryToItemType(category: string): string {
  return 'ATTACHMENT'; // All weapon components are attachments
}

/**
 * Convert category to availability (default to TRADE_ONLY)
 */
function getDefaultAvailability(category: string): string {
  return 'TRADE_ONLY';
}

/**
 * Fetch icon URL for a single item (using shared browser)
 */
async function fetchItemDetailWithBrowser(page: any, itemLink: ItemLink): Promise<ItemDetail | null> {
  try {
    const result = await fetchIconFromWikiPageWithBrowser(page, itemLink.url);
    
    if (!result.iconUrl) {
      console.log(`⚠️  No icon found for: ${itemLink.name}`);
      return null;
    }

    // Create item detail with default values
    const itemDetail: ItemDetail = {
      name: itemLink.name,
      image: result.iconUrl,
      description: `${itemLink.name} - ${itemLink.category}`,
      rarity: 'Common', // Default, can be updated later
      type: categoryToItemType(itemLink.category),
      availability: getDefaultAvailability(itemLink.category),
      npcBuyPrice: null,
      npcSellPrice: null,
      averagePrice: 0,
      wikiUrl: itemLink.url,
      category: itemLink.category
    };

    return itemDetail;
  } catch (error) {
    console.error(`❌ Error fetching ${itemLink.name}:`, error);
    return null;
  }
}

/**
 * Fetch details for specific items (using single browser)
 */
async function fetchItemDetailsForItems(items: ItemLink[]): Promise<ItemDetail[]> {
  if (items.length === 0) {
    return [];
  }

  console.log(`\n🚀 Fetching details for ${items.length} items...\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    const details: ItemDetail[] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`[${i + 1}/${items.length}] Processing: ${item.name}`);

      const detail = await fetchItemDetailWithBrowser(page, item);
      
      if (detail) {
        details.push(detail);
        successCount++;
        console.log(`  ✅ Got icon: ${detail.image}`);
      } else {
        failCount++;
      }

      // Small delay between requests
      if (i < items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Success: ${successCount}`);
    console.log(`  ❌ Failed: ${failCount}`);
    console.log(`  📦 Total: ${details.length} items`);

    return details;
  } finally {
    await browser.close();
  }
}

/**
 * Save item details to JSON file
 */
function saveItemDetails(details: ItemDetail[], outputPath: string) {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const data = {
    itemList: details,
    metadata: {
      lastUpdated: new Date().toISOString().split('T')[0],
      source: 'Project Delta Roblox Wiki',
      wikiBaseUrl: 'https://project-delta-a.fandom.com/wiki/',
      imageBaseUrl: 'https://static.wikia.nocookie.net/project-delta-a/images/',
      totalItems: details.length
    }
  };

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n💾 Saved ${details.length} items to: ${outputPath}`);
}

/**
 * Main function
 */
async function main() {
  const linksPath = path.join(process.cwd(), 'storage', 'items', 'wiki_item_links.json');
  const outputPath = path.join(process.cwd(), 'storage', 'items', 'item_list.json');

  try {
    // Load item links
    console.log('📖 Loading item links...');
    const links = loadItemLinks(linksPath);
    
    const allItems: ItemLink[] = [
      ...links.weapons,
      ...links.fronts,
      ...links.handles,
      ...links.stocks,
      ...links.muzzles,
      ...links.optics,
      ...links.extras,
      ...links.magazines,
      ...links.helmets,
      ...links.visors,
      ...links.chestRigs,
      ...links.legArmor,
      ...links.backpacks,
      ...links.clothes,
      ...links.masks,
      ...links.gloves,
      ...links.equipment,
      ...links.ammunition,
      ...links.deployables,
      ...links.consumables,
      ...links.keys,
      ...links.junk
    ];

    const totalLinks = allItems.length;
    console.log(`✅ Loaded ${totalLinks} item links\n`);

    // Load existing items
    console.log('📖 Loading existing items...');
    const existingItems = loadExistingItems(outputPath);
    console.log(`✅ Found ${existingItems.length} existing items\n`);

    // Create a map of existing items by wikiUrl
    const existingMap = new Map<string, ItemDetail>();
    existingItems.forEach(item => {
      existingMap.set(item.wikiUrl, item);
    });

    // Filter items that need to be fetched
    const itemsToFetch = allItems.filter(item => {
      const existing = existingMap.get(item.url);
      // Fetch if:
      // 1. Item doesn't exist in existing items
      // 2. Item exists but has no image or has "Coming_Soon.png"
      return !existing || 
             !existing.image || 
             existing.image.includes('Coming_Soon.png') ||
             existing.image.includes('Coming_Soon') ||
             existing.image === '' ||
             existing.image === null;
    });

    console.log(`📊 Items to fetch: ${itemsToFetch.length} (out of ${allItems.length} total)`);
    console.log(`   Already have: ${allItems.length - itemsToFetch.length} items\n`);

    if (itemsToFetch.length === 0) {
      console.log('✨ All items already fetched!');
      return;
    }

    // Fetch details for missing items only
    const newDetails = await fetchItemDetailsForItems(itemsToFetch);

    // Merge with existing items
    const mergedDetails = [...existingItems];
    
    // Update or add new items
    newDetails.forEach(newItem => {
      const existingIndex = mergedDetails.findIndex(item => item.wikiUrl === newItem.wikiUrl);
      if (existingIndex >= 0) {
        mergedDetails[existingIndex] = newItem; // Update existing
      } else {
        mergedDetails.push(newItem); // Add new
      }
    });

    // Save merged data
    saveItemDetails(mergedDetails, outputPath);

    console.log('\n✨ Done!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { fetchItemDetailWithBrowser, fetchItemDetailsForItems, saveItemDetails };

