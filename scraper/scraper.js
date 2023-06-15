import { Builder, By, until } from 'selenium-webdriver';
import fs from 'fs';


// Data already parsed before and not matching selection criteria for extensions
// import blacklist from './blacklist.json'  assert { type: "json" };
// const blacklist = JSON.parse(fs.readFileSync('./blacklist.json', 'utf8'));
// console.log(blacklist);

const keywords = [
    'annotate',
    'annotation',
    'co browse',
    'co browser',
    'co browsing',
    'co-browse',
    'co-browser',
    'co-browsing',
    'co-editing',
    'co-annotation',
    'co-navigation',
    'cobrowse',
    'cobrowser',
    'cobrowsing',
    'collab',
    'collaborate',
    'collaboration',
    'collaboration extension',
    'collaboration tools',
    'collaborative annotation',
    'collaborative browsing',
    'collaborative chat',
    'collaborative document editing',
    'collaborative document review',
    'collaborative editing',
    'collaborative extension',
    'collaborative project management',
    'collaborative to-do list',
    'collaborative tools',
    'collaborative workspace',
    'collective browsing',
    'collective chat',
    'remote collaboration',
    'remote annotation',
    'remote browsing',
    'remote browser',
    'remote chat',
    'remote clipboard',
    'group annotations',
    'group browsing',
    'group browser',
    'group chat',
    'group collaboration',
    'group clipboard',
    'group extension',
    'group note-taking',
    'group project management',
    'group workspace',
    'real-time chat',
    'real-time collaboration',
    'real-time editing',
    'real-time annotation',
    'screen sharing',
    'shared annotations',
    'shared browsing',
    'shared browser',
    'shared chat',
    'shared clipboard',
    'shared collaboration',
    'shared document editing',
    'shared document review',
    'shared to-do list',
    'shared workspace',
    'team extension',
    'team tools',
    'team annotations',
    'team browsing',
    'team browser',
    'team chat',
    'team clipboard',
    'team collaboration',
    'team extension',
    'team note-taking',
    'team project management',
    'team workspace',
];


// const text = 'Durchschnittliche Bewertung: 4.7 von 5.234  45.234 Nutzer haben diesen Artikel bewertet.';
const regex = /(\d+(?:\.\d+)?)(?:\s*\.?\s*\d*)?\s+von\s+(\d+(?:\.\d+)?)(?:\s*\.?\s*\d*)?\s+(\d+(?:\.\d+)?)/;

export async function runScraper() {
    // Create a new WebDriver instance
    const driver = await new Builder().forBrowser('chrome').build();

    const results = new Map();

    try {
        // Loop through each keyword
        for (const keyword of keywords) {

            // url encode the keyword
            const encodedKeyword = encodeURIComponent(keyword);

            // Navigate to the search results page for the keyword
            await driver.get(`https://chrome.google.com/webstore/search/${encodedKeyword}?_category=extensions`);

            // Wait for the search results to load
            await driver.wait(until.elementLocated(By.css('.webstore-test-wall-tile')), 10000);

            // Scroll down to page to load min 15 search results per page
            await driver.executeScript('window.scrollTo(0,3000);');
            // Wait for the search results to load
            await driver.sleep(300);

            // Extract the search results
            const extensions = await driver.findElements(By.css('.webstore-test-wall-tile'));

            // Loop through each search result and extract the desired information
            for (const extension of extensions) {

                const newExtensiion = {};

                try {
                    newExtensiion.name = await extension.findElement(By.css('.a-na-d-w')).getText();
                    newExtensiion.description = await extension.findElement(By.css('.a-na-d-Oa')).getText();
                    newExtensiion.url = await extension.findElement(By.css('.h-Ja-d-Ac')).getAttribute('href');
                    const ratingText = await extension.findElement(By.css('.Y89Uic')).getAttribute('title');
                    const match = ratingText.match(regex);

                    if (match) {
                        newExtensiion.rating = Number(match[1]);
                        newExtensiion.ratings = Number(match[3].replace('.', ''));
                    }

                }
                catch (error) {
                    console.error(error);
                }
                // Add the extracted information to the array of results

                if (newExtensiion.name !== undefined) {
                    results.set(newExtensiion.name, newExtensiion);
                }
            }
        }
    } finally {
        // Quit the WebDriver instance when the scraping is complete
        await driver.quit();
    }

    console.log('Total results: ', results.size);
    // retrieve the values from the map
    const resultsArray = Array.from(results.values());

    const filteredResults = resultsArray;
        // .filter((item) => !(blacklist.some((extension) => item.name == extension.name)));
    console.log('Filtered results: ', filteredResults.length);

    filteredResults.sort((a, b) => {
        return b.rating - a.rating;
    });

    // Write the extracted information to a file
    fs.writeFileSync(`results.json`, JSON.stringify(filteredResults, null, 2));

    return filteredResults;
}

