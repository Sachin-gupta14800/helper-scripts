const fs = require("fs");
const path = require("path");

const logPath = path.join(__dirname, "prod-na.txt"); // Adjust if needed
const lines = fs.readFileSync(logPath, "utf-8").split("\n");

const errorGroups = {};
let lastErrorMessage = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  // 1. Capture specific `error= Error: ...` line from error block
  if (line.startsWith("error: Error while")) {
    const match = line.match(/error=\s*(Error: .+)$/);
    if (match) {
      lastErrorMessage = match[1].trim();
    }
  }

  // 2. Match the following encryptDecryptResult to get the connection ID
  if (line.includes("logName=encryptDecryptResult") && lastErrorMessage) {
    const connectionMatch = line.match(/connection=([a-f0-9]+)/);
    if (connectionMatch) {
      const connId = connectionMatch[1];
      if (!errorGroups[lastErrorMessage]) {
        errorGroups[lastErrorMessage] = [];
      }
      errorGroups[lastErrorMessage].push(connId);
    }
    lastErrorMessage = null;
  }
}

// 3. Format output
let output = "";
for (const [errorMsg, connections] of Object.entries(errorGroups)) {
  output += `Grouped Error: ${errorMsg}\n`;
  connections.forEach(connId => {
    output += `  '${connId}',\n`;
  });
  output += "\n";
}

// 4. Save result to file
const outPath = path.join(__dirname, "refined_grouped_errors_by_connection.txt");
fs.writeFileSync(outPath, output, "utf-8");

console.log("✅ Grouped error output saved to:", outPath);
