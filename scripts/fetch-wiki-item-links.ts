/**
 * Script to fetch all weapon component links from Project Delta Wiki
 * 
 * This script:
 * 1. Goes to Weapon Components page
 * 2. Extracts all item links (Fronts, Handles, Stocks, Muzzles, Optics, Extras, Magazines)
 * 3. Saves links to JSON file
 * 
 * Usage:
 *   tsx scripts/fetch-wiki-item-links.ts
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

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

/**
 * Fetch item links from a single Wiki page
 */
async function fetchItemLinksFromPage(page: any, wikiUrl: string, category: string): Promise<ItemLink[]> {
  console.log(`📖 Loading: ${wikiUrl}`);
  await page.goto(wikiUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for content to load
  await page.waitForSelector('h2, .mw-parser-output, li', { timeout: 10000 });

  // Extract all item links
  const links = await page.evaluate((categoryName: string) => {
    // @ts-ignore - Browser context, no TypeScript types
    const result: any[] = [];

    // List of navigation/admin link texts to exclude
    const excludeTexts = [
      'History', 'Purge', 'Talk', 'Edit', 'View source',
      'Local Sitemap', 'Community Central', 'Special:', 'Category:',
      'File:', 'Template:', 'Help:', 'User:', 'User talk:',
      'Project:', 'Project talk:', 'Image:', 'Media:'
    ];
    
    // List of query parameters to exclude
    const excludeParams = ['action=history', 'action=purge', 'action=edit', 'action=delete'];
    
    // List of container/item types to exclude (these are usually in table cells but not the main item)
    const excludeItemTypes = [
      'Crate', 'Box', 'Bag', 'Container', 'Drop', 'Supply', 'Military', 'Shipping',
      'Spawnable', 'Lootable', 'Airdrop', 'Supply Drop'
    ];
    
    // First, try to find links in tables (more structured)
    const tables = document.querySelectorAll('table.wikitable, table');
    tables.forEach((table) => {
      const rows = table.querySelectorAll('tbody tr');
      
      // Find the "Name" column index from header
      const headerRow = table.querySelector('thead tr, tr:first-child');
      let nameColumnIndex = -1;
      
      if (headerRow) {
        const headers = headerRow.querySelectorAll('th, td');
        headers.forEach((header, index) => {
          const headerText = header.textContent?.toLowerCase() || '';
          // Look for "Name" column specifically
          if (headerText.includes('name') && !headerText.includes('image') && !headerText.includes('slot')) {
            nameColumnIndex = index;
          }
        });
      }
      
      // If no "Name" column found in header, try second column (usually name column after image)
      if (nameColumnIndex === -1) {
        nameColumnIndex = 1; // Default to second column (first is usually image)
      }
      
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length > nameColumnIndex && nameColumnIndex >= 0) {
          const nameCell = cells[nameColumnIndex];
          
          if (nameCell) {
            const links = nameCell.querySelectorAll('a[href*="/wiki/"]');
            links.forEach((link) => {
              const href = link.getAttribute('href');
              const text = link.textContent?.trim() || '';
              
              if (!href || !text) {
                return;
              }
              
              // Skip navigation/admin links
              if (href.includes(':') || href.includes('#') || href.includes('Special:')) {
                return;
              }
              
              // Skip links with excluded query parameters
              if (excludeParams.some(param => href.includes(param))) {
                return;
              }
              
              // Skip links with excluded text
              if (excludeTexts.some(excludeText => text === excludeText || text.includes(excludeText))) {
                return;
              }
              
              // Skip container/item type links (these are usually spawn locations, not the item itself)
              if (excludeItemTypes.some(excludeType => text.includes(excludeType))) {
                return;
              }
              
              const fullUrl = href.startsWith('http') ? href : `https://project-delta-a.fandom.com${href}`;
              
              // Avoid duplicates
              const exists = result.some((item) => item.url === fullUrl);
              if (!exists) {
                result.push({ name: text, url: fullUrl, category: categoryName });
              }
            });
          }
        }
      });
    });
    
    // Also find links in list items (for pages without tables)
    const listLinks = document.querySelectorAll('li a[href*="/wiki/"]');
    listLinks.forEach((link) => {
      const href = link.getAttribute('href');
      const text = link.textContent?.trim() || '';
      
      if (!href || !text) {
        return;
      }
      
      // Skip navigation/admin links
      if (href.includes(':') || href.includes('#') || href.includes('Special:')) {
        return;
      }
      
      // Skip links with excluded query parameters
      if (excludeParams.some(param => href.includes(param))) {
        return;
      }
      
      // Skip links with excluded text
      if (excludeTexts.some(excludeText => text === excludeText || text.includes(excludeText))) {
        return;
      }
      
      // Skip links that are in navigation menus, footers, or page actions
      const parent = link.closest('nav, footer, .wds-tab, .page-header, .page-footer, .navigation, .sidebar, .page-header__actions, .page-header__contribute, .page-header__top');
      if (parent) {
        return;
      }
      
      // Skip container/item type links
      if (excludeItemTypes.some(excludeType => text.includes(excludeType))) {
        return;
      }
      
      const fullUrl = href.startsWith('http') ? href : `https://project-delta-a.fandom.com${href}`;
      
      // Avoid duplicates
      const exists = result.some((item) => item.url === fullUrl);
      if (!exists) {
        result.push({ name: text, url: fullUrl, category: categoryName });
      }
    });
    
    return result;
  }, category);

  return links;
}

/**
 * Fetch all item links from multiple Wiki pages
 */
async function fetchItemLinks(urls: { url: string; category: string }[]): Promise<ItemLinksResult> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Initialize result object
    const result: ItemLinksResult = {
      weapons: [],
      fronts: [],
      handles: [],
      stocks: [],
      muzzles: [],
      optics: [],
      extras: [],
      magazines: [],
      helmets: [],
      visors: [],
      chestRigs: [],
      legArmor: [],
      backpacks: [],
      clothes: [],
      masks: [],
      gloves: [],
      equipment: [],
      ammunition: [],
      deployables: [],
      consumables: [],
      keys: [],
      junk: []
    };

    // Fetch links from each page
    for (const { url, category } of urls) {
      try {
        const links = await fetchItemLinksFromPage(page, url, category);
        
        // Special handling for Weapon Components - need to categorize by subcategories
        if (category === 'Weapon Components') {
          // Categorize each link based on its name/content
          links.forEach((link) => {
            const lowerName = link.name.toLowerCase();
            let subCategory: keyof ItemLinksResult | null = null;
            
            if (lowerName.includes('front assembly') || lowerName.includes('front')) {
              subCategory = 'fronts';
            } else if (lowerName.includes('handle')) {
              subCategory = 'handles';
            } else if (lowerName.includes('stock')) {
              subCategory = 'stocks';
            } else if (lowerName.includes('muzzle') || lowerName.includes('suppressor') || lowerName.includes('flash hider')) {
              subCategory = 'muzzles';
            } else if (lowerName.includes('scope') || lowerName.includes('sight') || lowerName.includes('optic')) {
              subCategory = 'optics';
            } else if (lowerName.includes('flashlight') || lowerName.includes('laser')) {
              subCategory = 'extras';
            } else if (lowerName.includes('magazine') || lowerName.includes('round') || lowerName.includes('ammo box')) {
              subCategory = 'magazines';
            }
            
            if (subCategory && subCategory in result) {
              (result[subCategory] as ItemLink[]).push(link);
            }
          });
        } else {
          // For other categories, map directly
          // Handle special cases for category names
          let categoryKey: keyof ItemLinksResult;
          if (category === 'Chest Rigs') {
            categoryKey = 'chestRigs';
          } else if (category === 'Leg Armor') {
            categoryKey = 'legArmor';
          } else {
            categoryKey = category.toLowerCase().replace(/\s+/g, '') as keyof ItemLinksResult;
          }
          
          if (categoryKey in result) {
            (result[categoryKey] as ItemLink[]).push(...links);
          } else {
            console.warn(`⚠️  Category key "${categoryKey}" not found in result object for category "${category}"`);
          }
        }
        
        console.log(`✅ Found ${links.length} items from ${category}`);
        
        // Small delay between pages
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Error fetching ${category}:`, error);
      }
    }

    return result;

  } catch (error) {
    console.error('Error fetching item links:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Save item links to JSON file
 */
function saveItemLinks(links: ItemLinksResult, outputPath: string) {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(links, null, 2), 'utf-8');
  console.log(`\n💾 Saved ${Object.values(links).flat().length} item links to: ${outputPath}`);
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Fetching item links from Wiki...\n');

  // Define all Wiki pages to fetch
  const wikiPages = [
    { url: 'https://project-delta-a.fandom.com/wiki/Weapons', category: 'Weapons' },
    { url: 'https://project-delta-a.fandom.com/wiki/Weapon_Components', category: 'Weapon Components' },
    { url: 'https://project-delta-a.fandom.com/wiki/Helmets', category: 'Helmets' },
    { url: 'https://project-delta-a.fandom.com/wiki/Visors', category: 'Visors' },
    { url: 'https://project-delta-a.fandom.com/wiki/Chest_Rigs', category: 'Chest Rigs' },
    { url: 'https://project-delta-a.fandom.com/wiki/Leg_Armor', category: 'Leg Armor' },
    { url: 'https://project-delta-a.fandom.com/wiki/Backpacks', category: 'Backpacks' },
    { url: 'https://project-delta-a.fandom.com/wiki/Clothes', category: 'Clothes' },
    { url: 'https://project-delta-a.fandom.com/wiki/Masks', category: 'Masks' },
    { url: 'https://project-delta-a.fandom.com/wiki/Gloves', category: 'Gloves' },
    { url: 'https://project-delta-a.fandom.com/wiki/Equipment', category: 'Equipment' },
    { url: 'https://project-delta-a.fandom.com/wiki/Ammunition', category: 'Ammunition' },
    { url: 'https://project-delta-a.fandom.com/wiki/Deployables', category: 'Deployables' },
    { url: 'https://project-delta-a.fandom.com/wiki/Magazines', category: 'Magazines' },
    { url: 'https://project-delta-a.fandom.com/wiki/Consumables', category: 'Consumables' },
    { url: 'https://project-delta-a.fandom.com/wiki/Keys', category: 'Keys' },
    { url: 'https://project-delta-a.fandom.com/wiki/Junk', category: 'Junk' }
  ];

  try {
    const links = await fetchItemLinks(wikiPages);

    // Print summary
    console.log('\n📊 Summary:');
    console.log('='.repeat(80));
    console.log(`Weapons:`);
    console.log(`  Weapons: ${links.weapons.length} items`);
    console.log(`Weapon Components:`);
    console.log(`  Fronts: ${links.fronts.length} items`);
    console.log(`  Handles: ${links.handles.length} items`);
    console.log(`  Stocks: ${links.stocks.length} items`);
    console.log(`  Muzzles: ${links.muzzles.length} items`);
    console.log(`  Optics: ${links.optics.length} items`);
    console.log(`  Extras: ${links.extras.length} items`);
    console.log(`  Magazines: ${links.magazines.length} items`);
    console.log(`Wearables:`);
    console.log(`  Helmets: ${links.helmets.length} items`);
    console.log(`  Visors: ${links.visors.length} items`);
    console.log(`  Chest Rigs: ${links.chestRigs.length} items`);
    console.log(`  Leg Armor: ${links.legArmor.length} items`);
    console.log(`  Backpacks: ${links.backpacks.length} items`);
    console.log(`  Clothes: ${links.clothes.length} items`);
    console.log(`  Masks: ${links.masks.length} items`);
    console.log(`  Gloves: ${links.gloves.length} items`);
    console.log(`Other:`);
    console.log(`  Equipment: ${links.equipment.length} items`);
    console.log(`  Ammunition: ${links.ammunition.length} items`);
    console.log(`  Deployables: ${links.deployables.length} items`);
    console.log(`  Consumables: ${links.consumables.length} items`);
    console.log(`  Keys: ${links.keys.length} items`);
    console.log(`  Junk: ${links.junk.length} items`);
    console.log(`Total: ${Object.values(links).flat().length} items`);

    // Save to JSON file
    const outputPath = path.join(process.cwd(), 'storage', 'items', 'wiki_item_links.json');
    saveItemLinks(links, outputPath);

    // Print all links (optional, can be commented out for large datasets)
    // console.log('\n📋 All Links:');
    // Object.entries(links).forEach(([category, items]) => {
    //   if (items.length > 0) {
    //     console.log(`\n${category.toUpperCase()}:`);
    //     items.forEach((item, index) => {
    //       console.log(`  ${index + 1}. ${item.name}`);
    //       console.log(`     ${item.url}`);
    //     });
    //   }
    // });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { fetchItemLinks, saveItemLinks };

