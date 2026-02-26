const fs = require('fs');
const https = require('https');
const path = require('path');

// Extract country codes from config.js
const configPath = path.join(__dirname, 'js', 'config.js');
const configContent = fs.readFileSync(configPath, 'utf8');

// Extract country codes using regex
const countryCodes = [];
const regex = /(\w{2}):\s*{/g;
let match;

while ((match = regex.exec(configContent)) !== null) {
  const countryCode = match[1];
  if (countryCode.length === 2) { // Only take 2-letter country codes
    // Deduplicate codes
    if (!countryCodes.includes(countryCode.toLowerCase())) {
      countryCodes.push(countryCode.toLowerCase());
    }
  }
}

console.log(`Found ${countryCodes.length} unique country codes`);

// Create flags directory if it doesn't exist
const flagsDir = path.join(__dirname, 'img', 'flags');
if (!fs.existsSync(flagsDir)) {
  fs.mkdirSync(flagsDir, { recursive: true });
}

// Download flags
let downloadCount = 0;
let errorCount = 0;
const downloadFlag = (code) => {
  const url = `https://flagcdn.com/w80/${code}.png`;
  const filePath = path.join(flagsDir, `${code}.png`);
  
  // Skip if file already exists and has content
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    if (stats.size > 0) {
      console.log(`Flag for ${code} already exists, skipping`);
      downloadCount++;
      if (downloadCount + errorCount === countryCodes.length) {
        console.log(`All flags processed! Downloaded: ${downloadCount}, Errors: ${errorCount}`);
      }
      return;
    }
  }
  
  const file = fs.createWriteStream(filePath);
  https.get(url, (response) => {
    if (response.statusCode !== 200) {
      console.error(`Failed to download flag for ${code}: ${response.statusCode}`);
      file.close();
      fs.unlink(filePath, (err) => {
        if (err) console.error(`Error deleting failed download: ${err.message}`);
      });
      errorCount++;
      if (downloadCount + errorCount === countryCodes.length) {
        console.log(`All flags processed! Downloaded: ${downloadCount}, Errors: ${errorCount}`);
      }
      return;
    }
    
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      downloadCount++;
      console.log(`Downloaded flag for ${code} (${downloadCount}/${countryCodes.length})`);
      
      if (downloadCount + errorCount === countryCodes.length) {
        console.log(`All flags processed! Downloaded: ${downloadCount}, Errors: ${errorCount}`);
      }
    });
  }).on('error', (err) => {
    console.error(`Error downloading flag for ${code}:`, err.message);
    file.close();
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Error deleting failed download: ${err.message}`);
    });
    errorCount++;
    if (downloadCount + errorCount === countryCodes.length) {
      console.log(`All flags processed! Downloaded: ${downloadCount}, Errors: ${errorCount}`);
    }
  });
};

// Download all flags with a small delay between requests to avoid rate limiting
countryCodes.forEach((code, index) => {
  setTimeout(() => {
    downloadFlag(code);
  }, index * 100);
}); 