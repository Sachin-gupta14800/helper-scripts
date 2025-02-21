const fs = require('fs');
const Chance = require('chance');
const chance = new Chance();

const generateRecord = () => {
    return {
        id: chance.guid(),
        name: chance.name(),
        place: chance.city(),
        address: chance.address(),
        pincode: chance.zip(),
        data: chance.sentence()
      };
};

const generateData = (numRecords) => {
  const records = [];
  for (let i = 0; i < numRecords; i++) {
    records.push(generateRecord());
    if (i % 100000 === 0) {
      console.log(`Generated ${i} records`);
    }
  }
  return records;
};

const numRecords = 1000000;
const data = generateData(numRecords);

fs.writeFile('data.json', JSON.stringify(data, null, 2), (err) => {
  if (err) {
    console.error('Error writing file:', err);
  } else {
    console.log('File has been written successfully');
  }
});