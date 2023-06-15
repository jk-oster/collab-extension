import { runAnalysis } from './analyzer.js';
import { runScraper } from './scraper.js';
import readline from 'readline';
import { promisify } from 'util';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = promisify(rl.question).bind(rl);

(async function () {
    const skipScraping = await question('Skip scraping? (y/n) ');
    if (skipScraping === 'n') {
        await runScraper();
        await question('Press any key to continue...');
    }

    const fileName = await question('Enter the name of the file to analyze: ');
    await runAnalysis(fileName);
})();