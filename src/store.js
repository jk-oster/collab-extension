import {reactive} from "vue";

// Import webextension-polyfill to allow for cross-browser compatibility
// Wraps the chrome browser-API in a promise-based API
const browser = require("webextension-polyfill");

/**
 * Store for all data that needs to be shared across components & synced with extension storage
 */
export const store = reactive({
    created: "",
    cursorSize: 20,
    mouseX: 0,
    mouseY: 0,
    name: "",
    positionType: 'page',
    sessionId: "",
    showSelf: false,
    syncOn: true,
    updateInterval: 500,
    url: "",
    selectedText: "",
    userId: "",
    users: [],
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

// Save all store values to extension storage to persist them across sessions, pages & devices
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

// Save a single value to extension storage to persist it across sessions, pages & devices
export function saveToExtStorage(name, value) {
    browser.storage.sync.set({
        [name]: value,
    });
}

// Save a single value to extension storage and additional store object to persist it across sessions, pages & devices
export function saveToExtStorageAnd(store = {}, name, value) {
    store[name] = value;
    saveToExtStorage(name, value);
    return store;
}

// Load a single value from extension storage
export async function loadFromExtStorage(propName) {
    return browser.storage.sync.get(propName).then((result) => {
        return result[propName];
    });
}

// Initialize extension storage listeners to save changes to store
export function initStorageListeners(store = {}) {
    setStorageListeners([saveExtStorageChangesTo(store)], [saveExtStorageChangesTo(store)]);
}

// Save all changes from extension storage event to store
export const saveExtStorageChangesTo = (store = {}) => (changes) => {
    for (const key in changes) {
        store[key] = changes[key].newValue;
    }
}

// Set listeners for extension storage changes
export function setStorageListeners(
    syncFunctions = [(changes) => {}],
    localFunctions = [(changes) => {}]
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
//----------------------------------------------------------------

// Send a message to the current content script
export async function sendToCurrentContentScript(message) {
    browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
        console.log('sending to tabs though browser', tabs);
        return browser.tabs.sendMessage(tabs[0].id, message);
    });
}

// Send a message to the background service
export async function sendToRuntime(message) {
    console.log('sending to runtime from browser', message);
    return browser.runtime.sendMessage(message);
}

// Send a message to all content scripts
export function sendToAllContentScripts(message, responseCallback = (result) => {}) {
    browser.tabs.query({}).then((tabs) => {
        for (const tab of tabs) {
            console.log('sending to tabs though browser', tab);
            browser.tabs.sendMessage(tab.id, message).then(responseCallback);
        }
    });
}

// Add a listener for messages from the extension runtime
export function addExtensionMessageListener(action = 'update', callbackFn = (message, sender) => {}) {
    browser.runtime.onMessage.addListener(async (message, sender) => {
        if ('action' in message && message['action'] === action) {
            console.log('received runtime message from browser', message);
            callbackFn(message, sender);
        }
    });
}
