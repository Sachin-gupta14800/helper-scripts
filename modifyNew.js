const fs = require('fs');
const path = require('path');

// Read the JSON file
function readJSON(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(data));
            }
        });
    });
}

// Write the JSON file
function writeJSON(filePath, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Modify the properties of each object in the array
function modifyProperties(array) {
    return array.map((item, index) => {
        // Modify the properties as needed
        item["Primary Item Qualifier"] = `VN${index}`;
        item["PrimaryItemID"] = index;
        item["Retail Assortment"] = `Blank${index}`;
        item["Update Indicator"] = `C${index}`;
        delete item["ImageURL"]; // Remove the ImageURL property
        item["G40"] = item["G40"].map((g40Item, g40Index) => {
            g40Item["Item Number"] = g40Item["Item Number"].replace('~', '');
            return g40Item;
        });
        return item;
    });
}

async function main() {
    const inputFilePath = path.join(__dirname, 'Request.json');
    const outputFilePath = path.join(__dirname, 'ModifiedRequest.json');

    try {
        const data = await readJSON(inputFilePath);
        const modifiedData = modifyProperties(data); // Assuming the input is a single object, wrap it in an array
        await writeJSON(outputFilePath, modifiedData);
        console.log('Modified data written to', outputFilePath);
    } catch (err) {
        console.error('Error processing file:', err);
    }
}

main();