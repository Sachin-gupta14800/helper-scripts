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
      const content = Array.from(data).map(item => `'${item.slice(1,-2)}',`).join('\n'); //item.slice(0, -1)
        fs.writeFile(filePath, content, 'utf8', (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

async function filterCSV(file1Path, file2Path, outputPath) {
    try {
        const file1Data = await readCSV(file1Path);
        const file2Data = await readCSV(file2Path);
        //elements in file2Data that are not in file1Data
        const difference = new Set([...file2Data].filter(x => !file1Data.has(x)));

        await writeCSV(outputPath, difference);
        console.log('Filtered data written to', outputPath);
    } catch (err) {
        console.error('Error processing files:', err);
    }
}

// Example usage
const file1Path = path.join(__dirname, 'EDI_NS_file.csv');
const file2Path = path.join(__dirname, 'connectionDisableAll.csv');
const outputPath = path.join(__dirname, 'output2.csv');

// filterCSV(file1Path, file2Path, outputPath);

async function convertCSV(inputPath, outputPath) {
  try {
      const data = await readCSV(inputPath);
      await writeCSV(outputPath, data);
      console.log('Converted data written to', outputPath);
  } catch (err) {
      console.error('Error processing files:', err);
  }
}

// Example usage
const inputPath = path.join(__dirname, 'newFile.csv');
const outputpath2 = path.join(__dirname, 'newFile.csv');

convertCSV(inputPath, outputpath2);