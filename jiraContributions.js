const axios = require('axios');
const xlsx = require('xlsx');

const JIRA_DOMAIN = 'https://celigo.atlassian.net/';
const JIRA_EMAIL = 'sachin.gupta@celigo.com'; // Replace with your email
const JIRA_API_TOKEN = '<token>'; // Replace with your Jira API token
const AUTHORS = ["sachin.gupta@celigo.com"]; // List of authors
const DATE_FILTER = "2024-03-01"; // Date filter for Jira issues

const authHeader = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`;

// Function to fetch Jira issues assigned to a user
const getJiraIssues = async (author) => {
    let issues = [];
    let startAt = 0;
    const maxResults = 50; // Max Jira API limit
    let totalStoryPoints = 0;
    let reviewStoryPoints = 0;
    let codeStoryPoints = 0;
    let spikeStoryPoints = 0;

    while (true) {
        try {
            const jql = `assignee="${author}" AND updated >= "${DATE_FILTER}" ORDER BY updated ASC`;
            const response = await axios.get(
                `${JIRA_DOMAIN}/rest/api/3/search?jql=${encodeURIComponent(jql)}&startAt=${startAt}&maxResults=${maxResults}`,
                { headers: { Authorization: authHeader, "Content-Type": "application/json" } }
            );
            response.data.issues.forEach((issue) => {
                if (!!issue.fields.status.name!= "Open" && (!!issue?.fields?.issuetype?.name !== "Epic" || !!issue?.fields?.issuetype?.name !== "Story" || !!issue?.fields?.issuetype?.name !== "Bug")) {
                    if(issue.fields.issuetype.name === "Review"){
                        reviewStoryPoints += issue.fields.customfield_10102 || 0;
                    }
                    if(issue.fields.issuetype.name === "Code"){
                        codeStoryPoints += issue.fields.customfield_10102 || 0;
                    }
                    if(issue.fields.issuetype.name === "Spike"){
                        spikeStoryPoints += issue.fields.customfield_10102 || 0;
                    }
                    totalStoryPoints += issue.fields.customfield_10102 || 0;
                }
            });

            issues.push(...response.data.issues);

            // Pagination: Break when no more issues
            if (response.data.issues.length < maxResults) break;
            startAt += maxResults;
        } catch (error) {
            console.error(`Error fetching Jira issues for ${author}:`, error.response?.data || error.message);
            break;
        }
    }
    return {
        author,
        issuesLength: issues.length,
        reviewStoryPoints,
        codeStoryPoints,
        totalStoryPoints,
        spikeStoryPoints
    }
};

// Function to write data to Excel
const writeToExcel = (data) => {
    const worksheetData = [["Author", "Total trackers", "Story points", "Review Story Points"]];

    data.forEach((entry) => {
        worksheetData.push([entry.author, entry.issuesLength, entry.totalStoryPoints, entry.reviewStoryPoints]);
    });

    const ws = xlsx.utils.aoa_to_sheet(worksheetData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Jira Issues");
    xlsx.writeFile(wb, "Jira_Issues.xlsx");
    console.log("Excel file created: Jira_Issues.xlsx");
};

// Main function
const main = async () => {
    let data = [];

    for (const author of AUTHORS) {
        const authorData = await getJiraIssues(author);
        data.push(authorData);
    }

    if (data.length > 0) {
        writeToExcel(data);
    } else {
        console.log("No Jira issues found.");
    }
};

main();
