import {reactive} from "vue";

const browser = require("webextension-polyfill");

export const store = reactive({
    users: [],
    sessionId: "",
    userId: "",
    name: "",
    created: "",
    mouseX: 0,
    mouseY: 0,
    url: "",
    positionType: 'page',
    cursorSize: 20,
    showSelf: false,
    syncOn: true,
    updateInterval: 500,
});

//----------------------------------------------------------------
// Extension Storage Sync Service Functions
//----------------------------------------------------------------

export async function loadAllFromExtStorageTo(store) {
    return browser.storage.sync.get().then((result) => {
        store.sessionId = result?.sessionId ?? "";
        store.userId = result?.userId ?? "";
        store.name = result?.name ?? "";
        store.positionType = result?.positionType ?? "page";
        store.cursorSize = result?.cursorSize ?? 20;
        store.showSelf = result?.showSelf ?? false;
        store.syncOn = result?.syncOn ?? true;
        store.updateInterval = result?.updateInterval ?? 500;
    });
}

export async function saveToExtStorageFrom(store) {
    browser.storage.sync.set({
        sessionId: store.sessionId,
        userId: store.userId,
        name: store.name,
        positionType: store.positionType,
        cursorSize: Number(store.cursorSize),
        showSelf: store.showSelf,
        syncOn: store.syncOn,
        updateInterval: Number(store.updateInterval),
    });
}

export function saveToExtStorage(name, value) {
    browser.storage.sync.set({
        [name]: value,
    });
}

export function saveToExtStorageAnd(store, name, value) {
    store[name] = value;
    saveToExtStorage(name, value);
}

export async function loadFromExtStorage(name) {
    return browser.storage.sync.get(name).then((result) => {
        return result[name];
    });
}

export function initStorageListeners(store) {
    setStorageListeners([saveExtStorageChangesTo(store)], [saveExtStorageChangesTo(store)]);
}

export const saveExtStorageChangesTo = (store) => (changes) => {
    for (const key in changes) {
        store[key] = changes[key].newValue;
    }
}

export function setStorageListeners(
    syncFunctions = [(changes) => {
    }],
    localFunctions = [(changes) => {
    }]
) {
    browser.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "sync") {
            for (const func of syncFunctions) {
                func(changes);
            }
        } else if (areaName === "local") {
            for (const func of localFunctions) {
                func(changes);
            }
        }
    });
}

//----------------------------------------------------------------
// Extension Messaging Service
// TODO: Refactor to use browser instead of chrome to make it work in Firefox
// BUG: messages through "browser" object are not received in Content Scripts
//----------------------------------------------------------------

function connectToContent() {
    // browser.tabs.query({ currentWindow: true, active: true
    // }).then((tabs) => {
    //     browser.tabs.sendMessage(tabs[0].id, {greeting: "Activate Tab"});
    // });

    chrome.tabs.query({ currentWindow: true, active: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {greeting: "Activate Tab"});
    });
}
export function getContentConnection() {
    // browser.tabs.onActivated.addListener(connectToContent);
    chrome.tabs.onActivated.addListener(connectToContent);
}

export async function sendToCurrentContentScript(message) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        console.log('sending to tabs though chrome', tabs);
        return browser.tabs.sendMessage(tabs[0].id, message);
    });

    // browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
    //     console.log('sending to tabs though browser', tabs);
    //     return browser.tabs.sendMessage(tabs[0].id, message);
    // });
}

export async function sendToRuntime(message, callback = (result) => {} ) {
    console.log('sending to runtime from chrome & browser', message);
    chrome.runtime.sendMessage(message, callback);
    // return browser.runtime.sendMessage(message);
}

export function sendToAllContentScripts(message, responseCallback = (result) => {
}) {
    chrome.tabs.query({}, (tabs) => {
        for (const tab of tabs) {
            console.log('sending to tabs though chrome', tab);
            chrome.tabs.sendMessage(tab.id, message, responseCallback);
        }
    });

    // browser.tabs.query({}).then((tabs) => {
    //     for (const tab of tabs) {
    //         console.log('sending to tabs though browser', tab);
    //         browser.tabs.sendMessage(tab.id, message).then(responseCallback);
    //     }
    // });
}

export function addExtensionMessageListener(action = 'update', callbackFn = (message, sender, sendResponse = function () {}) => {}) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // console.log('received runtime message from chrome', message);
        if ('action' in message && message['action'] === action) {
            console.log('received runtime message from chrome', message);
            callbackFn(message, sender, sendResponse);
        }
    });

    // browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    //     if (action in message && message['action'] === action) {
    //         console.log('received runtime message from browser', message);
    //         callbackFn(message, sender, sendResponse);
    //     }
    // });

}
