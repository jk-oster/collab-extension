# Extension Research - WebScraper
This web scraper is used to extract information about extensions from the chrome web store. The information is stored in a json file. The scraper is written in JavaScript and uses the Selenium framework.

The scraper consists of two parts:
- The scraper itself (scraper.js) which is used to extract the information from the chrome web store search matching the given keywords.
- The analyzer (analyzer.js) which is used to analyze the collected information and pull in more detailed data from the extension detail pages.

The scraper collects the following information about the extensions:
```json
{
    "name": "",
    "description": "",
    "url": "",
    "rating": 0,
    "ratings": 0,
    "longDescription": "",
    "lastUpdated": "",
    "userCount": 0,
    "homePage": ""
}
```

## Usage
The scraper can be used by executing the following commands:
```shell
npm install
node .
```