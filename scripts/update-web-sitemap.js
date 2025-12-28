#!/usr/bin/env node

/**
 * Updates the sitemap-data.json file with version and date information
 * from git tags and project data.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load project data
const projectsDataPath = path.join(__dirname, '../apps/web/lib/projects/data.ts');
const projectsContent = fs.readFileSync(projectsDataPath, 'utf8');

// Load package.json for sbozh-me version
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Path to sitemap data file
const sitemapDataPath = path.join(__dirname, '../apps/web/lib/seo/sitemap-data.json');

// Load existing sitemap data or create new
let sitemapData = {};
if (fs.existsSync(sitemapDataPath)) {
  sitemapData = JSON.parse(fs.readFileSync(sitemapDataPath, 'utf8'));
}

// Parse projects from data.ts (simplified parsing)
const projects = [];

// Extract sbozh-me project
const sbozhMatch = projectsContent.match(/slug:\s*"sbozh-me"[\s\S]*?tabs:\s*\[([^\]]*)\]/);
if (sbozhMatch) {
  const tabs = [];
  const tabMatches = sbozhMatch[1].matchAll(/id:\s*"([^"]+)"/g);
  for (const match of tabMatches) {
    if (match[1] !== 'about') { // Skip about tab as it's the main route
      tabs.push(match[1]);
    }
  }
  projects.push({
    slug: 'sbozh-me',
    version: packageJson.version,
    tabs: tabs
  });
}

// Extract discord-community project
const discordMatch = projectsContent.match(/slug:\s*"discord-community"[\s\S]*?version:\s*"([^"]+)"[\s\S]*?tabs:\s*\[([^\]]*)\]/);
if (discordMatch) {
  const version = discordMatch[1];
  const tabs = [];
  const tabMatches = discordMatch[2].matchAll(/id:\s*"([^"]+)"/g);
  for (const match of tabMatches) {
    if (match[1] !== 'about') { // Skip about tab as it's the main route
      tabs.push(match[1]);
    }
  }
  projects.push({
    slug: 'discord-community',
    version: version,
    tabs: tabs
  });
}

// Function to get last modified date from version tag
function getLastModifiedFromTag(version) {
  try {
    // Get the commit date for this version tag
    const gitCommand = `git log -1 --format=%aI v${version} 2>/dev/null`;
    const lastCommit = execSync(gitCommand, { encoding: 'utf8' }).trim();
    if (lastCommit) {
      return lastCommit;
    }
  } catch (e) {
    // Tag might not exist yet
  }
  // Fallback to current date
  return new Date().toISOString();
}

// Add common routes (root, /projects)
sitemapData['/'] = {
  version: packageJson.version,
  lastModified: getLastModifiedFromTag(packageJson.version)
};

sitemapData['/projects'] = {
  version: packageJson.version,
  lastModified: getLastModifiedFromTag(packageJson.version)
};

// Update sitemap data for each project
projects.forEach(project => {
  const basePath = `/projects/${project.slug}`;
  const lastModified = getLastModifiedFromTag(project.version);

  // Update main project route
  sitemapData[basePath] = {
    version: project.version,
    lastModified: lastModified
  };

  // Update tab routes
  project.tabs.forEach(tab => {
    const tabPath = `${basePath}/${tab}`;
    sitemapData[tabPath] = {
      version: project.version,
      lastModified: lastModified
    };
  });
});

// Sort keys for consistent output
const sortedData = {};
Object.keys(sitemapData).sort().forEach(key => {
  sortedData[key] = sitemapData[key];
});

// Write updated sitemap data
fs.writeFileSync(sitemapDataPath, JSON.stringify(sortedData, null, 2));

console.log(`✅ Updated sitemap-data.json with ${Object.keys(sortedData).length} routes`);
Object.keys(sortedData).forEach(route => {
  console.log(`   ${route}: v${sortedData[route].version}`);
});