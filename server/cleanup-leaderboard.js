import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPETITIVE_LEADERBOARD_PATH = path.join(__dirname, 'competitive_leaderboard.csv');

const cleanupLeaderboard = () => {
  try {
    console.log('Running leaderboard cleanup to remove duplicate wallet addresses...');
    
    if (!fs.existsSync(COMPETITIVE_LEADERBOARD_PATH)) {
      console.log('Competitive leaderboard file does not exist, no cleanup needed');
      return;
    }
    
    const fileContent = fs.readFileSync(COMPETITIVE_LEADERBOARD_PATH, 'utf8');
    if (!fileContent.trim() || fileContent.trim() === 'name,score,date,address') {
      console.log('Competitive leaderboard is empty or only has headers, no cleanup needed');
      return;
    }
    
    // Backup the original file first
    const backupPath = path.join(__dirname, `competitive_leaderboard_backup_${Date.now()}.csv`);
    fs.writeFileSync(backupPath, fileContent);
    console.log(`Original leaderboard backed up to: ${backupPath}`);
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    // Check if we have any records to process
    if (records.length === 0) {
      console.log('No records found in leaderboard, no cleanup needed');
      return;
    }
    
    console.log(`Processing ${records.length} leaderboard entries for duplicate wallets...`);
    
    // Display all unique wallet addresses for reference
    const uniqueAddresses = new Set(records.map(record => record.address));
    console.log(`Found ${uniqueAddresses.size} unique wallet addresses in ${records.length} entries`);
    
    // Map to store the best score for each wallet address
    const addressMap = new Map();
    
    // Process each record
    for (const record of records) {
      const address = record.address;
      const score = parseInt(record.score, 10);
      
      // Skip records without an address
      if (!address) continue;
      
      // Check if we've seen this address before
      if (!addressMap.has(address) || score > parseInt(addressMap.get(address).score, 10)) {
        addressMap.set(address, record);
      }
    }
    
    // Convert map back to array
    const cleanedLeaderboard = Array.from(addressMap.values());
    
    // Sort by score in descending order
    cleanedLeaderboard.sort((a, b) => parseInt(b.score, 10) - parseInt(a.score, 10));
    
    // Check if we removed any duplicates
    const duplicatesRemoved = records.length - cleanedLeaderboard.length;
    console.log(`Found ${duplicatesRemoved} duplicate wallet addresses in the leaderboard`);
    
    if (duplicatesRemoved > 0) {
      // Write the cleaned leaderboard back to the file
      const csvContent = stringify(cleanedLeaderboard, { header: true });
      fs.writeFileSync(COMPETITIVE_LEADERBOARD_PATH, csvContent);
      console.log(`Leaderboard cleaned up - removed ${duplicatesRemoved} duplicate wallet entries`);
      console.log(`New leaderboard contains ${cleanedLeaderboard.length} unique entries`);
      
      // Display top 5 entries in the cleaned leaderboard
      console.log('\nTop 5 entries in cleaned leaderboard:');
      cleanedLeaderboard.slice(0, 5).forEach((entry, index) => {
        console.log(`#${index + 1}: ${entry.name} - Score: ${entry.score} - Address: ${entry.address.substring(0, 6)}...`);
      });
    } else {
      console.log('No duplicate wallet addresses found, leaderboard is clean');
    }
  } catch (error) {
    console.error('Error cleaning up leaderboard:', error);
  }
};

// Run the cleanup function
cleanupLeaderboard(); 