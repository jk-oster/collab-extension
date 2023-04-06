import {initStorageListeners, loadAllFromExtStorageTo} from "@/store";

import browser from "webextension-polyfill";
import {addExtensionMessageListener, sendToAllContentScripts, sendToCurrentContentScript} from "@/service";
import {
    addMessageToSession,
    addNewSession,
    addShapeToSession,
    addUserToSession,
    deleteSession,
    deleteSessionMessage,
    deleteSessionShape,
    deleteSessionUser,
    initWatchingMessages,
    initWatchingShapes,
    initWatchingUsers,
    updatePosition
} from "@/firebase";

let store = {};
loadAllFromExtStorageTo(store);
initStorageListeners(store);

browser.runtime.onInstalled.addListener(async () => {
    console.log("Background Service Installed");
    // let url = browser.runtime.getURL("options/options.html");
    // await browser.tabs.create({ url });


    // force inject content scripts into all open tabs
    for (const contentScript of browser.runtime.getManifest().content_scripts) {
        for (const tab of await chrome.tabs.query({url: contentScript.matches})) {
            try {
                await browser.scripting.executeScript({
                    target: {tabId: tab.id},
                    files: contentScript.js,
                });
            }
            catch (e) {
                console.log(e);
            }
        }
    }

    // Initialize listeners for messages from content script
    addExtensionMessageListener('delete-session', deleteSession);
    addExtensionMessageListener('start-session', startSession);
    addExtensionMessageListener('create-session', addNewSession);
    addExtensionMessageListener('add-shape', addShapeToSession);
    addExtensionMessageListener('add-message', addMessageToSession);
    addExtensionMessageListener('add-user', addUserToSession);
    addExtensionMessageListener('update-position', updatePosition);
    addExtensionMessageListener('delete-shape', deleteSessionShape);
    addExtensionMessageListener('delete-message', deleteSessionMessage);
    addExtensionMessageListener('delete-user', deleteSessionUser);
});

browser.runtime.onMessage.addListener((message) => {
   console.log('logging received message from background service', message);
});

// Add user to session in firebase
export function startSession({sessionId = '', user = {
    mouseX: 0,
    mouseY: 0,
    id: '',
    name: '',
    selectedText: '',
    url: '',
    color: '',
}}) {
    if (sessionId && user) {
        addUserToSession({user, sessionId, userId: user.id}).then(() => {

            console.log('Successfully joined session');

            // start listening to changes in users positions and update the store -> store state updates UI
            initWatchingUsers(sessionId, (users) => sendToCurrentContentScript({action: 'update-users', data: users}));

            // Initialize messages
            initWatchingMessages(sessionId, (messages) => sendToCurrentContentScript({action: 'update-messages', data: messages}));

            // Initialize shapes
            initWatchingShapes(sessionId, (shapes) => sendToCurrentContentScript({action: 'update-shapes', data: shapes}));
        });
    }
}

