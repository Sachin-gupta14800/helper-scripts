const fs = require('fs');
const path = require('path');

function readCSV(filePath) {
  return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
              reject(err);
          } else {
              const rows = data.split('\n').map(row => row.trim()).filter(row => row.length > 0);
              resolve(new Set(rows));
          }
      });
  });
}

function writeCSV(filePath, data) {
  return new Promise((resolve, reject) => {
      const content = Array.from(data).map(item => `"${item}"`).join('\n');
      fs.writeFile(filePath, content, 'utf8', (err) => {
          if (err) {
              reject(err);
          } else {
              resolve();
          }
      });
  });
}


function extractWsIds(rows) {
  const wsIdSet = new Set();
  rows.forEach(row => {
      const match = row.match(/expOrImpId=([^,]+)/);
      if (match) {
          wsIdSet.add(match[1]);
      }
  });
  return wsIdSet;
}

async function fetchDistinctWsIds(inputPath, outputPath) {
  try {
      const rows = await readCSV(inputPath);
      const wsIds = extractWsIds(rows);
      // console.log('Distinct wsIds:', Array.from(wsIds));
      await writeCSV(outputPath, wsIds);
  } catch (err) {
      console.error('Error processing file:', err);
  }
}

const inputPath = path.join(__dirname, '040225.csv');
const outputPath = path.join(__dirname, 'output04.csv');

fetchDistinctWsIds(inputPath, outputPath);


async function findUniqueIds(file1Path, file2Path, outputPath) {
  try {
      const file1Data = await readCSV(file1Path);
      const file2Data = await readCSV(file2Path);

      const uniqueToFile1 = new Set([...file1Data].filter(id => !file2Data.has(id)));
      const uniqueToFile2 = new Set([...file2Data].filter(id => !file1Data.has(id)));

      const uniqueIds = new Set([...uniqueToFile1, ...uniqueToFile2]);

      await writeCSV(outputPath, uniqueIds);
      console.log('Unique WebSocket IDs written to', outputPath);
  } catch (err) {
      console.error('Error processing files:', err);
  }
}

// Example usage
const file1Path = path.join(__dirname, 'output5.csv');
const file2Path = path.join(__dirname, 'output6.csv');
const outputPath2 = path.join(__dirname, 'unique_wsIds4.csv');

// findUniqueIds(file1Path, file2Path, outputPath2);