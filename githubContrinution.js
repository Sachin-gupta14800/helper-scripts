const axios = require('axios');
const xlsx = require('xlsx');
const fs = require('fs');

const ORG_NAME = 'celigo'; // Replace with your GitHub organization name
const GITHUB_TOKEN = '<token>'; // Replace with your GitHub personal access token
const AUTHORS = ['Sachin-gupta14800']; // Array of authors

// Set up Axios instance with authorization headers
const axiosInstance = axios.create({
    headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
    },
});

// Function to get all repositories in the organization
const getReposInOrg = async () => {
    try {
        const response = await axiosInstance.get(`https://api.github.com/orgs/${ORG_NAME}/repos?per_page=100`);
        return response.data;
    } catch (error) {
        console.error('Error fetching repos:', error);
        return [];
    }
};

// Function to get PRs created by an author in a specific repo
const getPRsCreatedByAuthor = async (repo, author) => {
    try {
        const response = await axiosInstance.get(`https://api.github.com/repos/${ORG_NAME}/${repo}/pulls?state=all&creator=${author}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching PRs:', error);
        return [];
    }
};

// Function to check if the PR was closed
const filterClosedPRs = (prs) => {
    return prs.filter((pr) => pr.state === 'closed');
};

// Function to fetch reviews for a PR
const getPRReviews = async (repo, prNumber) => {
    try {
        const response = await axiosInstance.get(`https://api.github.com/repos/${ORG_NAME}/${repo}/pulls/${prNumber}/reviews`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching reviews for PR ${prNumber}:`, error);
        return [];
    }
};

// Function to get PRs where the author has reviewed but did not create
const getReviewsByAuthorOnOthersPRs = async (author) => {
    let allReviews = [];

    // Get all repos for the organization
    const repos = await getReposInOrg();

    for (const repoObj of repos) {
        const repoName = repoObj.name;

        // Get PRs created by the author
        const prs = await getPRsCreatedByAuthor(repoName, author);

        // Filter the closed PRs
        const closedPRs = filterClosedPRs(prs);

        // Loop through each closed PR
        for (const pr of closedPRs) {
            // Get reviews for this PR
            const reviews = await getPRReviews(repoName, pr.number);

            // Check if the author has reviewed the PR and is not the creator
            const authorReview = reviews.find(
                (review) => review.user.login === author && pr.user.login !== author
            );

            if (authorReview) {
                allReviews.push({
                    author: author,
                    prNumber: pr.number,
                    repo: repoName,
                    prTitle: pr.title,
                    authorReview,
                });
            }
        }
    }

    return allReviews;
};

// Function to write data to Excel sheet
const writeToExcel = (data) => {
    const worksheetData = [];

    // Add headers
    worksheetData.push(['Author', 'PR Number', 'Repository', 'PR Title', 'Review Body']);

    // Loop through the data and push rows
    data.forEach((entry) => {
        worksheetData.push([entry.author, entry.prNumber, entry.repo, entry.prTitle, entry.authorReview.body]);
    });

    // Create worksheet
    const ws = xlsx.utils.aoa_to_sheet(worksheetData);
    // Create a new workbook and append the sheet
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'PR Reviews');
    // Write to file
    xlsx.writeFile(wb, 'PR_Reviews.xlsx');
};

// Main function
const main = async () => {
    let allReviews = [];

    for (const author of AUTHORS) {
        const reviews = await getReviewsByAuthorOnOthersPRs(author);
        reviews.forEach((review) => {
            review.author = author; // Add the author's name to the review data
            allReviews.push(review);
        });
    }

    if (allReviews.length > 0) {
        writeToExcel(allReviews);
        console.log('Excel file created: PR_Reviews.xlsx');
    } else {
        console.log('No reviews found.');
    }
};

main();
