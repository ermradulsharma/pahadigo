const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

const coreFiles = getAllFiles('src/core');
const missingTests = [];

coreFiles.forEach(file => {
  if (file.endsWith('.js') && !file.includes('__mocks__')) {
    const relativePath = path.relative('src/core', file);
    const testPath = path.join('tests', relativePath.replace('.js', '.test.js'));
    
    if (!fs.existsSync(testPath)) {
      // Check if it's a seeder or helper which might be in different locations
      if (relativePath.startsWith('Database' + path.sep + 'Seeders')) {
          // Seeders are tested in tests/Database/Seeders
          if (!fs.existsSync(path.join('tests', relativePath.replace('.js', '.test.js')))) {
              missingTests.push(file);
          }
      } else if (relativePath.startsWith('Helpers')) {
          // Helpers are in tests/helpers (lowercase h)
          const helperTestPath = path.join('tests', 'helpers', path.basename(file, '.js') + '.test.js');
          if (!fs.existsSync(helperTestPath)) {
              missingTests.push(file);
          }
      } else {
          missingTests.push(file);
      }
    }
  }
});

console.log('Missing tests for:');
missingTests.forEach(f => console.log(f));
