import { Builder, By, until } from 'selenium-webdriver';
import fs from 'fs';

const regex = /(\d+(?:\.\d+)?)(?:\s*\.?\s*\d*)?\s+von\s+(\d+(?:\.\d+)?)(?:\s*\.?\s*\d*)?\s+(\d+(?:\.\d+)?)/;

export async function runAnalysis(fileName) {
    let extensions = [];
    // Create a new WebDriver instance
    const driver = await new Builder().forBrowser('chrome').build();

    try {
        extensions = JSON.parse(fs.readFileSync(fileName, 'utf8'));
    }
    catch (error) {
        console.error(error);
        return;
    }

    console.log('Extensions to analyze: ', extensions.length);

    const results = new Map();

    try {
        // Loop through each keyword
        for (const extension of extensions) {
            // Navigate to the search results page for the keyword
            await driver.get(extension.url);

            // Wait for the search results to load
            await driver.wait(until.elementLocated(By.css('.C-b-p-j-D-gi')), 10000);

            // Extract the search results
            const extensionElem = await driver.findElement(By.css('.F-ia-k'));

            const newExtensiion = { ...extension };

            try {
                newExtensiion.longDescription = await extensionElem.findElement(By.css('.C-b-p-j-Oa')).getText();

                const ratingText = await extensionElem.findElement(By.css('.Y89Uic')).getAttribute('title');
                const match = ratingText.match(regex);

                if (match) {
                    newExtensiion.rating = Number(match[1]);
                    newExtensiion.ratings = Number(match[3].replace('.', ''));
                }

                newExtensiion.lastUpdated = await extensionElem
                    .findElement(By.css('.h-C-b-p-D-xh-hh')).getText(); // .C-b-p-D-Xe
                newExtensiion.userCount = Number((await extensionElem.findElement(By.css('.e-f-ih'))
                    .getText()).replace(' Nutzer', '').replace('.', '').replace('+', ''));

                const headerElem = await extensionElem.findElement(By.css('.e-f-Ri-G'));
                if (headerElem) {
                    newExtensiion.homePage = await headerElem.findElement(By.css('.e-f-y')).getAttribute('href');
                }
            }
            catch (error) {
                console.error(error);
            }
            // Add the extracted information to the array of results

            if (newExtensiion.longDescription !== undefined) {
                results.set(newExtensiion.name, newExtensiion);
            }


        }
    } finally {

        // Quit the WebDriver instance when the scraping is complete
        await driver.quit();
    }

    // retrieve the values from the map
    const resultsArray = Array.from(results.values());

    resultsArray.sort((a, b) => {
        return b.rating - a.rating;
    });

    console.log(resultsArray.length);

    // Write the extracted information to a file
    fs.writeFileSync(`analyzed-results.json`, JSON.stringify(resultsArray, null, 2));
}
