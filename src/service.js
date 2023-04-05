import {
    initStorageListeners,
    loadAllFromExtStorageTo,
    saveToExtStorageAnd,
    store
} from "@/store";
import {
    addNewSession,
    addUserToSession,
    deleteSession,
    getRandId,
    initMessages, initShapes,
    initUsers,
    updatePosition
} from "@/firebase";
import browser from "webextension-polyfill";

let interval = 0;

export async function initService() {
    console.log('App mounted');

    // Load all data from extension storage to store (settings, userId, sessionId, name)
    await loadAllFromExtStorageTo(store);

    // Initialize storage listeners to update store when settings are changed from options page or popup
    initStorageListeners(store);

    // If no userId is set, generate a new one and save it
    if (!store.userId) {
        const userId = getRandId();
        saveToExtStorageAnd(store, 'userId', userId);
    }

    // Synchronize cursor position with store
    addEventListener("mousemove", (event) => {
        store.mouseX = event[store.positionType + 'X'];
        store.mouseY = event[store.positionType + 'Y'];
        store.url = window.location.href;
    });

    // Synchronize selection with store
    addEventListener('mouseup', () => {
        const selectedText = getSelectionText();
        if (selectedText) {
            store.selectedText = selectedText
        }
        store.url = window.location.href;
    });

    // Initialize listener for updates of firebase user
    addEventListener("positions-updated", markSelectionsOfUsers);

    // Add listeners for extension messages from popup, options or background
    addExtensionMessageListener('restart-interval', restartInterval);
    addExtensionMessageListener('join-session', joinSession);
    addExtensionMessageListener('create-session', createSession);
    addExtensionMessageListener('leave-session', deleteCurrentSession);
    addExtensionMessageListener('set-name', setName);
    addExtensionMessageListener('copy-to-clipboard', (message) => {
        console.log('copy-to-clipboard', message);
        // Set focus on the document again through alert before copying to enable copy to clipboard
        alert('Session ID copied to clipboard!');
        copyToClipboard(store.sessionId)
    });

    // Synchronize position with firebase
    restartInterval();

    // If user is already in a session, join it again
    if (store.sessionId && store.userId && store.name) {
        startSession();
    }

    // Initialize follow service interval
    initFollowUser();

    console.log('Base services initialized!');
}

// Set interval for following user position
export function initFollowUser() {
    setInterval(() => {
        if (store.userToFollow) {
            const user = store.users.find(user => user.id === store.userToFollow);
            if (user && user.url === window.location.href) {
                scrollToUser(user);
            }
        }
    }, 300);
}

export function scrollToUser(user) {
    window.scrollTo(user.mouseX, user.mouseY - (window.innerHeight / 2));
}

// Copy text to clipboard
export async function copyToClipboard(text = '') {
    console.log('copy-to-clipboard', text);
    return navigator.clipboard.writeText(text);
}

//--------------------------------------------------------------
// Selection handling services
//--------------------------------------------------------------

export function getSelectionText() {
    let text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}

export function markSelectionsOfUsers() {
    console.log('mark-selection');
    removeMarkedSelection();
    const selectedTexts = store.users.map(user => user.selectedText);
    selectedTexts.forEach(selectedText => {
        console.log(selectedText);
        if (selectedText) {
            // Wrap selected text in span
            highlightTextOccurrences(selectedText);
        }
    });
}

export function highlightTextOccurrences(text) {
    if (!text || text.length < 3) return;
    document.querySelectorAll('*').forEach((element) => {
        for (const node of Array.from(element.childNodes)) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.includes(text)) {
                element.innerHTML = element.innerHTML.replace(text, `<span class="col-ex-selected-text">$&</span>`);
                break;
            }
        }
    });
}

// Remove previous marked selection
export function removeMarkedSelection() {
    // unwrap selected text
    document.querySelectorAll('.col-ex-selected-text').forEach((element) => {
        element.outerHTML = element.innerHTML;
    });
}

//-------------------------------------------------------------------
// Session handling services
//-------------------------------------------------------------------

// Start an interval updating the position of the user in the session
export function restartInterval() {
    console.log('restart-interval', store);

    // Clear old interval if it exists
    clearInterval(interval);

    const getNewPosition = () => {
        return {
            mouseX: store.mouseX,
            mouseY: store.mouseY,
            selectedText: store.selectedText,
            url: store.url,
        };
    }

    const difference = (oldPosition) => {
        return oldPosition.mouseX !== store.mouseX ||
            oldPosition.mouseY !== store.mouseY ||
            oldPosition.selectedText !== store.selectedText ||
            oldPosition.url !== store.url;
    }

    const changedPosition = () => {
        if (difference(oldPosition)) {
            oldPosition = getNewPosition();
            return true;
        }
        return false;
    };

    let oldPosition = {};

    oldPosition = getNewPosition();
    // Check if position has changed

    // Interval to not spam firebase with updates
    interval = setInterval(() => {
        // If user is in a session and cursor position has changed update position
        if (store.sessionId && store.userId && store.name && changedPosition() && store.syncOn) {
            // Sync cursor position with firebase
            updatePosition({
                mouseX: store.mouseX,
                mouseY: store.mouseY,
                id: store.userId,
                name: store.name,
                url: store.url,
                selectedText: store.selectedText,
                color: store.color,
            }, store.sessionId, store.userId);
        }
    }, 500);
}

// Create new session in firebase and join it
export function createSession() {
    console.log('Create new Session');
    addNewSession().then(session => {
        saveToExtStorageAnd(store, 'sessionId', session.id);
        copyToClipboard(session.id);
        alert('Session created. The Session ID has been copied to your ClipBoard! You can share this id with your friends: ' + session.id);

        if (!store.name) {
            setName();
        }

        startSession();
    });
}

// Delete session in firebase, store, extension storage and leave it
export function deleteCurrentSession() {
    console.log('Deleting and leaving current Session');
    const currentSessionId = store.sessionId;
    saveToExtStorageAnd(store, 'sessionId', '');
    deleteSession(currentSessionId);
}

// Set name in store and extension storage
export function setName() {
    console.log('setName');
    const name = prompt('Enter your name');
    if (name) {
        saveToExtStorageAnd(store, 'name', name);
    }
}

// Give user the option to enter a session id and join it
export function joinSession() {
    console.log('Trying to join Session');

    // If no name is set, prompt user to set one
    if (!store.name) {
        setName();
    }

    // Prompt user to enter session id
    const sessionId = prompt('Enter session id');
    saveToExtStorageAnd(store, 'sessionId', sessionId);

    startSession();
}

// Add user to session in firebase
export function startSession() {
    if (store.sessionId) {
        addUserToSession({
            mouseX: store.mouseX,
            mouseY: store.mouseY,
            id: store.userId,
            name: store.name,
            selectedText: store.selectedText,
            url: store.url,
            color: store.color,
        }, store.sessionId, store.userId).then(() => {

            console.log('Successfully joined session');

            // start listening to changes in users positions and update the store -> store state updates UI
            initUsers(store.sessionId).then(() => console.log('Successfully initialized users', store.users));

            // Initialize messages
            initMessages(store.sessionId).then(() => console.log('Messages initialized!'));

            // Initialize shapes
            initShapes(store.sessionId).then(() => console.log('Shapes initialized!'));
        });
    }
}

//----------------------------------------------------------------
// Extension Messaging Service
//----------------------------------------------------------------

// Send a message to the current content script
export async function sendToCurrentContentScript(message) {
    try {
        browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
            console.log('sending to tabs though browser', tabs);
            return browser.tabs.sendMessage(tabs[0].id, message);
        });
    } catch (e) {
        console.log(e)
    }
}

// Send a message to the background service
export async function sendToRuntime(message) {
    try {
        console.log('sending to runtime from browser', message);
        return browser.runtime.sendMessage(message);
    } catch (e) {
        console.log(e)
    }
}

// Send a message to all content scripts
export function sendToAllContentScripts(message, responseCallback = (result) => {}) {
    try {
        browser.tabs.query({}).then((tabs) => {
            for (const tab of tabs) {
                console.log('sending to tabs though browser', tab);
                browser.tabs.sendMessage(tab.id, message).then(responseCallback);
            }
        });
    } catch (e) {
        console.log(e)
    }
}

// Add a listener for messages from the extension runtime
export function addExtensionMessageListener(action = 'update', callbackFn = (message, sender) => {}) {
    browser.runtime.onMessage.addListener(async (message, sender) => {
        if ('action' in message && message['action'] === action) {
            console.log('received runtime message from browser', message);
            callbackFn(message, sender);
        }
    });

    addEventListener(action, (event) => {
        console.log('received event message from window', event);
        callbackFn(event);
    });
}

export function dispatchExtensionMessage(action = 'update', message = {}) {
    const event = new CustomEvent(action, message);
    window.dispatchEvent(event);
}