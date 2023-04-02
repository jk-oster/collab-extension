const browser = require("webextension-polyfill");

browser.runtime.onInstalled.addListener(async () => {
    console.log("Background Service Installed");
    // let url = browser.runtime.getURL("options/options.html");
    // await browser.tabs.create({ url });

    // chrome.scripting.executeScript({
    //     file: 'hello-world.js'
    // });

    function greeting() {
        alert("Hello, World!");
    }

    chrome.scripting.executeScript({
        function: greeting
    });
});

browser.runtime.onMessage.addListener((message) => {
   console.log('logging received message from background service', message);
});