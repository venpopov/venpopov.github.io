#!/usr/bin/env node
/**
 * Dead Link Checker
 * 
 * Scans rendered HTML files for broken links.
 * Checks both hard 404s and soft 404s (pages that respond 200 but show "not found" content).
 * 
 * Usage: node check-links.js [--config path/to/config.json]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Default configuration
const DEFAULT_CONFIG = {
  siteDir: '_site',
  concurrency: 20,
  timeout: 10000,
  excludePatterns: ['^mailto:', '^tel:', '^javascript:', '^#'],
  skipDomains: [],
  softNotFoundPatterns: [
    'page not found',
    '404',
    'not found',
    'does not exist',
    'no longer available',
    'has been removed',
    "this page doesn't exist"
  ]
};

// Load configuration
function loadConfig() {
  const configArg = process.argv.indexOf('--config');
  const configPath = configArg !== -1 && process.argv[configArg + 1]
    ? path.resolve(process.argv[configArg + 1])
    : path.join(__dirname, 'linkcheck.config.json');
  
  let config = { ...DEFAULT_CONFIG };
  
  if (fs.existsSync(configPath)) {
    try {
      const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      config = { ...config, ...userConfig };
    } catch (e) {
      console.error(`Warning: Could not parse config file: ${e.message}`);
    }
  }
  
  return config;
}

// Get all HTML files recursively
function getHtmlFiles(dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...getHtmlFiles(fullPath));
    } else if (item.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Extract links from HTML file
function extractLinks(htmlPath, siteDir) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);
  const links = new Set();
  const relativePath = path.relative(siteDir, htmlPath);
  
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      links.add({ href, source: relativePath });
    }
  });
  
  return Array.from(links);
}

// Check if URL should be skipped
function shouldSkip(url, config) {
  // Check exclude patterns
  for (const pattern of config.excludePatterns) {
    if (new RegExp(pattern, 'i').test(url)) {
      return true;
    }
  }
  
  // Check skip domains
  try {
    const parsedUrl = new URL(url);
    for (const domain of config.skipDomains) {
      if (parsedUrl.hostname.includes(domain)) {
        return true;
      }
    }
  } catch {
    // Not a valid URL, might be relative - don't skip
  }
  
  return false;
}

// Check if response body indicates soft 404
function isSoftNotFound(body, config) {
  if (!body) {
    return true;
  }
  
  const $ = cheerio.load(body);
  
  // Check title for 404 indicators
  const title = $('title').text().toLowerCase();
  if (title.includes('404') || title.includes('not found') || title.includes('page not found')) {
    return true;
  }
  
  // Get text from key areas for pattern matching
  const h1Text = $('h1').text().toLowerCase();
  
  // Check for soft 404 patterns
  for (const pattern of config.softNotFoundPatterns) {
    const lowerPattern = pattern.toLowerCase();
    
    // Check in h1 tags (most indicative of error pages)
    if (h1Text.includes(lowerPattern)) {
      return true;
    }
    
    // Check in title
    if (title.includes(lowerPattern)) {
      return true;
    }
  }
  
  return false;
}

// Check a single URL
async function checkUrl(url, config, retries = 2) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      redirect: 'follow'
    });
    
    clearTimeout(timeoutId);
    
    if (response.status >= 400) {
      return { ok: false, status: response.status, reason: `HTTP ${response.status}` };
    }
    
    // For successful responses, check for soft 404
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      const body = await response.text();
      if (isSoftNotFound(body, config)) {
        return { ok: false, status: response.status, reason: 'Soft 404 (page shows not found content)' };
      }
    }
    
    return { ok: true, status: response.status };
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Retry on transient errors
    if (retries > 0 && (error.name === 'AbortError' || error.code === 'ECONNRESET')) {
      await new Promise(r => setTimeout(r, 1000));
      return checkUrl(url, config, retries - 1);
    }
    
    if (error.name === 'AbortError') {
      return { ok: false, status: 0, reason: 'Timeout' };
    }
    
    return { ok: false, status: 0, reason: error.message };
  }
}

// Check if a local file exists
function checkLocalPath(href, htmlPath, siteDir) {
  // Handle absolute paths (starting with /)
  let targetPath;
  if (href.startsWith('/')) {
    targetPath = path.join(siteDir, href);
  } else {
    // Relative path
    targetPath = path.join(path.dirname(htmlPath), href);
  }
  
  // Remove query strings and fragments
  targetPath = targetPath.split('?')[0].split('#')[0];
  
  // Check if path exists (could be file or directory with index.html)
  if (fs.existsSync(targetPath)) {
    return { ok: true };
  }
  
  // Try adding .html
  if (fs.existsSync(targetPath + '.html')) {
    return { ok: true };
  }
  
  // Try index.html in directory
  if (fs.existsSync(path.join(targetPath, 'index.html'))) {
    return { ok: true };
  }
  
  return { ok: false, reason: 'Local file not found' };
}

// Check links with concurrency control
async function checkLinksWithConcurrency(links, config, siteDir) {
  const results = [];
  const urlCache = new Map();
  const queue = [...links];
  let activeChecks = 0;
  let completed = 0;
  const total = links.length;
  
  return new Promise((resolve) => {
    const processNext = async () => {
      if (queue.length === 0 && activeChecks === 0) {
        resolve(results);
        return;
      }
      
      while (activeChecks < config.concurrency && queue.length > 0) {
        const link = queue.shift();
        activeChecks++;
        
        (async () => {
          const { href, source, htmlPath } = link;
          let result;
          
          // Check if it's an external URL
          if (href.startsWith('http://') || href.startsWith('https://')) {
            // Check cache first
            if (urlCache.has(href)) {
              result = urlCache.get(href);
            } else {
              result = await checkUrl(href, config);
              urlCache.set(href, result);
            }
          } else {
            // Local path
            result = checkLocalPath(href, htmlPath, siteDir);
          }
          
          if (!result.ok) {
            results.push({ href, source, ...result });
          }
          
          completed++;
          process.stdout.write(`\rChecking links: ${completed}/${total}`);
          
          activeChecks--;
          processNext();
        })();
      }
    };
    
    processNext();
  });
}

// Main function
async function main() {
  const config = loadConfig();
  const siteDir = path.resolve(config.siteDir);
  
  console.log(`\n🔍 Checking links in ${siteDir}...\n`);
  
  if (!fs.existsSync(siteDir)) {
    console.error(`❌ Site directory not found: ${siteDir}`);
    console.error('   Make sure to run "quarto render" first.');
    process.exit(1);
  }
  
  // Get all HTML files
  const htmlFiles = getHtmlFiles(siteDir);
  
  if (htmlFiles.length === 0) {
    console.log('No HTML files found.');
    process.exit(0);
  }
  
  console.log(`Found ${htmlFiles.length} HTML files.`);
  
  // Extract all links
  const allLinks = [];
  for (const htmlFile of htmlFiles) {
    const links = extractLinks(htmlFile, siteDir);
    for (const link of links) {
      if (!shouldSkip(link.href, config)) {
        allLinks.push({ ...link, htmlPath: htmlFile });
      }
    }
  }
  
  // Deduplicate by URL (but keep track of all sources)
  const uniqueLinks = [];
  const seen = new Map();
  
  for (const link of allLinks) {
    if (!seen.has(link.href)) {
      seen.set(link.href, [link.source]);
      uniqueLinks.push(link);
    } else {
      seen.get(link.href).push(link.source);
    }
  }
  
  console.log(`Found ${uniqueLinks.length} unique links to check.\n`);
  
  // Check all links
  const brokenLinks = await checkLinksWithConcurrency(uniqueLinks, config, siteDir);
  
  console.log('\n');
  
  if (brokenLinks.length === 0) {
    console.log('✅ No broken links found!\n');
    process.exit(0);
  }
  
  // Report broken links
  console.log(`\n❌ Found ${brokenLinks.length} broken link(s):\n`);
  
  for (const link of brokenLinks) {
    const sources = seen.get(link.href) || [link.source];
    console.log(`  🔗 ${link.href}`);
    console.log(`     Reason: ${link.reason}`);
    console.log(`     Found in: ${sources.join(', ')}`);
    console.log();
  }
  
  // Exit with error code to indicate broken links
  process.exit(1);
}

main();
