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
    return false; // No body doesn't mean not found - could be empty response
  }
  
  const $ = cheerio.load(body);
  
  const title = $('title').text().toLowerCase().trim();
  const h1Text = $('h1').first().text().toLowerCase().trim();

  // Strong indicators: title is PRIMARILY about 404/not found (not just contains "404")
  // These patterns indicate the page IS an error page, not a page that mentions 404
  const errorPageTitlePatterns = [
    /^404\b/,                           // Title starts with "404"
    /\b404\s*(error|page|-)\b/,         // "404 error", "404 page", "404 -"
    /\berror\s*404\b/,                  // "error 404"
    /^page not found/,                  // Title starts with "page not found"
    /^not found/,                       // Title starts with "not found"
    /page\s*(not|can'?t be)\s*found/,   // "page not found", "page can't be found"
    /^oops/i,                           // Error pages often start with "Oops"
  ];

  for (const pattern of errorPageTitlePatterns) {
    if (pattern.test(title)) {
      return true;
    }
  }
  
  // Check h1 only if it looks like an error heading (short and matches pattern)
  // Long h1s are likely real content, not error messages
  if (h1Text.length < 50) {
    for (const pattern of errorPageTitlePatterns) {
      if (pattern.test(h1Text)) {
        return true;
      }
    }
  }
  
  // Check for user-configured soft 404 patterns, but only in title and short h1
  for (const pattern of config.softNotFoundPatterns) {
    const lowerPattern = pattern.toLowerCase();
    
    // Only match if title is short (likely an error page title)
    if (title.length < 80 && title.includes(lowerPattern)) {
      return true;
    }
    
    // Only match h1 if it's short (error messages are typically brief)
    if (h1Text.length < 50 && h1Text.includes(lowerPattern)) {
      return true;
    }
  }
  
  return false;
}

// Browser-like headers to avoid bot detection
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1'
};

// Check a single URL
async function checkUrl(url, config, retries = 2) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: BROWSER_HEADERS,
      redirect: 'follow'
    });
    
    clearTimeout(timeoutId);
    
    // Handle different error codes
    if (response.status === 403 || response.status === 429) {
      // 403/429 often means bot detection, not a broken link
      // Try HEAD request as fallback - some servers allow HEAD but block GET
      const headResult = await tryHeadRequest(url, config);
      if (headResult.ok) {
        return { ok: true, status: response.status, note: 'Passed via HEAD request' };
      }
      // If both fail, mark as warning (not error) - likely bot detection
      return { ok: true, warning: true, status: response.status, reason: `HTTP ${response.status} (likely bot detection - verify manually)` };
    }

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

// Try a HEAD request as fallback (some servers block GET but allow HEAD)
async function tryHeadRequest(url, config) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: BROWSER_HEADERS,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);
    return { ok: response.status < 400, status: response.status };
  } catch {
    clearTimeout(timeoutId);
    return { ok: false };
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
            results.push({ href, source, ...result, type: 'error' });
          } else if (result.warning) {
            results.push({ href, source, ...result, type: 'warning' });
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
  // Resolve siteDir relative to the project root (parent of utils/ where this script lives)
  const projectRoot = path.resolve(__dirname, '..');
  const siteDir = path.resolve(projectRoot, config.siteDir);
  
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
  
  // Separate errors from warnings
  const errors = brokenLinks.filter(link => link.type === 'error');
  const warnings = brokenLinks.filter(link => link.type === 'warning');

  console.log('\n');
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ No broken links found!\n');
    process.exit(0);
  }
  
  // Report warnings (likely false positives due to bot detection)
  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} link(s) could not be verified (likely bot detection):\n`);

    for (const link of warnings) {
      const sources = seen.get(link.href) || [link.source];
      console.log(`  🔗 ${link.href}`);
      console.log(`     Reason: ${link.reason}`);
      console.log(`     Found in: ${sources.join(', ')}`);
      console.log();
    }
  }

  // Report errors (actual broken links)
  if (errors.length > 0) {
    console.log(`\n❌ Found ${errors.length} broken link(s):\n`);

    for (const link of errors) {
      const sources = seen.get(link.href) || [link.source];
      console.log(`  🔗 ${link.href}`);
      console.log(`     Reason: ${link.reason}`);
      console.log(`     Found in: ${sources.join(', ')}`);
      console.log();
    }

    // Exit with error code only if there are actual errors
    process.exit(1);
  }

  // If only warnings, exit successfully
  process.exit(0);
}

main();
