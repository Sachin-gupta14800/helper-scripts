const { Storage } = require('@google-cloud/storage');
const fs = require('fs')
const path = require('path')


const gcsConnectionObj = {
  projectId: 'project-id',
  credentials: {
    client_email: 'email',
    private_key: 'privatekey'
  }
};

// Create the GCS client
const storage = new Storage(gcsConnectionObj);

// Function to list all buckets in the project
async function listBuckets() {
  try {
    const [buckets] = await storage.getBuckets();
    console.log('Buckets:' + buckets);
    buckets.forEach(bucket => console.log(bucket.name));
  } catch (error) {
    console.error('Error listing buckets:', error);
  }
}

// listBuckets();

async function listObjectMetadata(bucketName) {
  try {
    // Get the bucket reference
    const bucket = storage.bucket(bucketName);

    // List all files in the bucket
    const [files] = await bucket.getFiles();

    console.log(`Files in bucket ${bucketName}:`);

    // Iterate through each file and retrieve metadata
    for (const file of files) {
      const [metadata] = await file.getMetadata();
      console.log(`File: ${file.name}`);
      // console.log(`Metadata:`, metadata);
    }
  } catch (error) {
    console.error('Error listing object metadata:', error);
  }
}

// Call the function to list metadata for a specific bucket
const bucketName = 'bucketName'; // Replace with your bucket name
// listObjectMetadata(bucketName);


const { BlobServiceClient } = require('@azure/storage-blob');

async function countBlobsInContainer() {
    // Replace with your connection string
    const connectionString = "DefaultEndpointsProtocol=https;AccountName=stagingdemo;AccountKey=tUAf8vn9+RajAd2NsAm3KKe4pcMBPDDir23MVPyhhy/I7jcTpF6Gz2PNyu9feXoSNmwbv1IwbQFH+AStkBotuw==;EndpointSuffix=core.windows.net";
    
    // Replace with your container name
    const containerName = "load";

    // Create a BlobServiceClient
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

    // Get the container client
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Initialize the counter
    let blobCount = 0;

    // Iterate through the blobs in the container
    for await (const blob of containerClient.listBlobsFlat()) {
      console.log('blobCount' + blobCount);
        blobCount++;
    }

    console.log(`Number of blobs in the container '${containerName}': ${blobCount}`);
}

// Run the function
countBlobsInContainer().catch((err) => {
    console.error("Error:", err.message);
});


// Function to extract wsIds from a CSV file and write them to a new CSV file
function extractWsIds(inputFilePath, outputFilePath) {
  // Read the file content
  fs.readFile(inputFilePath, 'utf8', (err, data) => {
      if (err) {
          console.error('Error reading file:', err);
          return;
      }

      // Split the file content into rows
      const rows = data.split('\n');
      const wsIdPattern = /wsId=([\w-]+)/;
      const wsIds = [];

      // Iterate over each row and extract the wsId if present
      rows.forEach(row => {
          const match = row.match(wsIdPattern);
          if (match) {
              wsIds.push(match[1]);
          }
      });

      // Prepare CSV data
      const csvContent = wsIds.map(wsId => `"${wsId}" OR`).join(' ');

      // Write the extracted wsIds to the output CSV file
      fs.writeFile(outputFilePath, csvContent, 'utf8', err => {
          if (err) {
              console.error('Error writing file:', err);
              return;
          }
          console.log('Extracted wsIds written to', outputFilePath);
      });
  });
}

// Example usage
const inputCsvFilePath = path.join(__dirname, 'file.csv');
const outputCsvFilePath = path.join(__dirname, 'extractedWsIds.csv');
// extractWsIds(inputCsvFilePath, outputCsvFilePath);