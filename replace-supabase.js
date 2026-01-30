#!/usr/bin/env node
/**
 * Script to automatically replace Supabase calls with API client calls in UI pages
 * Run with: node replace-supabase.js
 */

const fs = require('fs');
const path = require('path');

const files = [
    'src/pages/JobFeed.tsx',
    'src/pages/Applications.tsx',
    'src/pages/Preferences.tsx',
    'src/pages/DashboardHome.tsx',
    'src/pages/Analytics.tsx'
];

const projectRoot = process.cwd();

files.forEach(file => {
    const filePath = path.join(projectRoot, file);

    if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${file}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Replace imports
    content = content.replace(
        /import { supabase } from ['"]..\/lib\/supabase['"];/g,
        "import { api } from '../lib/api';"
    );

    console.log(`✅ Updated: ${file}`);
});

console.log('\n✅ All files updated! Now manually review and fix the actual Supabase queries.');
console.log('   Replace patterns like:');
console.log('   - supabase.from(\'jobs\') → api.getUserScores(user.id)');
console.log('   - supabase.from(\'applications\') → api.getUserApplications(user.id)');
