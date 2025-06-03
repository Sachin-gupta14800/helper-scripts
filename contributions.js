const axios = require('axios');
const xlsx = require('xlsx');
const fs = require('fs');

const ORG_NAME = 'celigo'; // Replace with your GitHub organization name
const GITHUB_TOKEN = '<token>'; // Replace with your GitHub personal access token
const AUTHORS = ['Sachin-gupta14800']; // Array of authors
const DATE_FILTER = '2024-03-01';

// Set up Axios instance with authorization headers
const axiosInstance = axios.create({
    headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
    },
});

// Function to get PRs created by an author in the organization after a specific date
const getPRsCreatedByAuthor = async (author) => {
    let authorPrs = [];
    let page = 1;
    const perPage = 100;
    while (true) {
        try {
            // Search query to get all PRs created by the author after the specific date
            const searchQuery = `is:pr created:>${DATE_FILTER} author:${author} org:${ORG_NAME}`;
            const response = await axiosInstance.get(`https://api.github.com/search/issues?q=${searchQuery}&per_page=${perPage}&page=${page}`);
            const prs = response.data.items;
            if (prs.length === 0) break;
            authorPrs = [...authorPrs, ...prs];
            if (prs.length < perPage) {
                break;
            }
            page++;
        } catch (error) {
            console.error('Error fetching PRs:', error);
            break;
        }
    }
    return authorPrs;
};

const getPRsReviewedByAuthor = async (author) => {
    let authorPrs = [];
    let page = 1;
    const perPage = 100;
    while (true) {
        try {
            // Search query to get all PRs created by the author after the specific date
            const searchQuery = `is:pr created:>${DATE_FILTER} -author:${author} reviewed-by:${author} org:${ORG_NAME}`;
            const response = await axiosInstance.get(`https://api.github.com/search/issues?q=${searchQuery}&per_page=${perPage}&page=${page}`);
            const prs = response.data.items;
            if (prs.length === 0) break;
            authorPrs = [...authorPrs, ...prs];
            if (prs.length < perPage) {
                break;
            }
            page++;
        } catch (error) {
            console.error('Error fetching PRs:', error);
            break;
        }
    }
    return authorPrs;
}

const checkPRFiles = async (repo, prNumber) => {
    try {
        const response = await axiosInstance.get(`https://api.github.com/repos/${ORG_NAME}/${repo}/pulls/${prNumber}/files`);
        const files = response.data.map(file => file.filename);
        
        return (files.length <= 2 && (files.includes('package.json') || files.includes('package-lock.json')));
    } catch (error) {
        console.error(`Error fetching PR files for PR #${prNumber}:`, error);
        return false;
    }
}

// Function to write data to Excel sheet
const writeToExcel = (data) => {
    const worksheetData = [];

    // Add headers
    worksheetData.push(['Author', 'Non-Package Total PRs', 'Reviewed PRs']);

    // Loop through the data and push rows
    data.forEach((entry) => {
        worksheetData.push([
            entry.author,
            entry.nonPackagePRs,
            entry.reviewedPRs
        ]);
    });

    // Create worksheet
    const ws = xlsx.utils.aoa_to_sheet(worksheetData);
    // Create a new workbook and append the sheet
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'PRs Summary');
    // Write to file
    xlsx.writeFile(wb, 'PRs_Summary.xlsx');
};

// Main function
const main = async () => {
    const data = [];
    for (const author of AUTHORS) {
        let uniqueRepos = new Set();
        //PRs count
        const prs = await getPRsCreatedByAuthor(author);
        // console.log(`total prs created by author${author}: ${prs.length}`);
        let mergedPrs = prs.filter(pr=> pr?.pull_request?.merged_at);
        // console.log(`Total merged Prs by ${author}: ${mergedPrs.length}`);
        let closedPrLength = prs.length - mergedPrs.length;
        // console.log(`Total PRs closed by author${author}: ${closedPrs}`);

        const nonPackagePRs = [];
        for(const pr of mergedPrs) {
            const repoName = pr.repository_url.split('/').pop();
            uniqueRepos.add(repoName);
            const hasPackageChanges = await checkPRFiles(repoName, pr.number);
            if(!hasPackageChanges) nonPackagePRs.push(pr);
        }
        // console.log(uniqueRepos.length);
        // console.log(`Total nonPackage Prs:${nonPackagePRs.length}`);

        //PRs reviewed
        const reviewedPrs = await getPRsReviewedByAuthor(author);
        // console.log(`PRs reviewed by author ${author}:${reviewedPrs.length}`);
        data.push({
            author,
            // totalPRs: prs.length,
            // mergedPRs: mergedPrs.length,
            // closedPrs: closedPrLength,
            // uniqueRepos: uniqueRepos.size,
            nonPackagePRs: nonPackagePRs.length,
            reviewedPRs: reviewedPrs.length
        })
    }
    writeToExcel(data);
};

main();
