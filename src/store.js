import {reactive} from "vue";

// Import webextension-polyfill to allow for cross-browser compatibility
// Wraps the chrome browser-API in a promise-based API
import browser from "webextension-polyfill";

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
    messages: [],
    shapes: [],
    userToFollow: '',
    showOffCanvas: false,
    color: '#e66465',
    showShapes: true,
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
        store.showOffCanvas = result?.showOffCanvas ?? false;
        store.color = result?.color ?? '#e66465';
        store.showShapes = result?.showShapes ?? true;
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
        showOffCanvas: store.showOffCanvas,
        color: store.color,
        showShapes: store.showShapes,
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

// Initialize extension storage listeners to save changes to store variable
export function initStorageListeners(store = {}) {
    setStorageListeners([saveExtStorageChangesTo(store)], [saveExtStorageChangesTo(store)]);
}

// Save all changes from extension storage event to store variable
export const saveExtStorageChangesTo = (store = {}) => (changes) => {
    for (const key in changes) {
        store[key] = changes[key].newValue;
    }
}

// Set listeners for extension storage changes
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
