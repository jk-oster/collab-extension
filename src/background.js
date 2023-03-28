// import { config } from '@/firebase.config.js';

const browser = require("webextension-polyfill");

browser.runtime.onInstalled.addListener(async () => {
    console.log("Background Service Installed");
    // let url = browser.runtime.getURL("options/options.html");
    // await browser.tabs.create({ url });
});

browser.runtime.onMessage.addListener((message) => {
   console.log('logging from background service', message);
});