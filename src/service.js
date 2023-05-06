import {
    initStorageListeners,
    loadAllFromExtStorageTo,
    saveToExtStorageAnd,
    store
} from "@/store";
import {getRandId} from "@/firebase";
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
        store.mouseX = event[store.positionType + 'X'] / window.innerWidth;
        store.mouseY = event[store.positionType + 'Y'] / getWindowTotalHeight();
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
    addExtensionMessageListener("update-users", (users) => {
        markSelectionsOfUsers();
        store.users = users;
    });

    // Initialize listener for updates of firebase shapes
    addExtensionMessageListener("update-shapes", (shapes) => {
        store.shapes = shapes;
    });

    // Initialize listener for updates of firebase messages
    addExtensionMessageListener("update-messages", (messages) => {
        store.messages = messages;
    });

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

export function getWindowTotalHeight() {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    return Math.max(
        htmlElement.clientHeight, htmlElement.scrollHeight, htmlElement.offsetHeight,
        bodyElement.scrollHeight, bodyElement.offsetHeight
    );
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
    window.scrollTo(user.mouseX * window.innerWidth, (user.mouseY * getWindowTotalHeight()) - (window.innerHeight / 2));
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
    store.users.forEach(user => {
        const selectedText = user.selectedText;
        console.log(selectedText);
        if (selectedText) {
            // Wrap selected text in span
            highlightTextOccurrences(selectedText, user);
        }
    });
}

export function highlightTextOccurrences(text, user) {
    if (!text || text.length < 3) return;
    document.querySelectorAll('body *').forEach((element) => {
        for (const node of Array.from(element.childNodes)) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.includes(text)) {
                element.innerHTML = element.innerHTML.replace(text, `<span class="col-ex-selected-text" style="background-color: ${user.color}">$&</span>`);
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

            sendToRuntime({
                action: 'update-position',
                data: {
                    position: {
                        mouseX: store.mouseX,
                        mouseY: store.mouseY,
                        id: store.userId,
                        name: store.name,
                        url: store.url,
                        selectedText: store.selectedText,
                        color: store.color,
                    },
                    sessionId: store.sessionId,
                    userId: store.userId
                }
            });
        }
    }, 500);
}

// Create new session in firebase and join it
export function createSession() {
    console.log('Create new Session');

    const sessionId = getRandId();

    saveToExtStorageAnd(store, 'sessionId', sessionId);

    const data = {
        sessionId: sessionId,
        user: {
            id: store.userId,
            name: store.name,
            url: store.url,
            mouseX: store.mouseX,
            mouseY: store.mouseY,
            selectedText: store.selectedText,
            color: store.color,
        }
    }

    sendToRuntime({action: 'create-session', data}).then(() => {
        copyToClipboard(sessionId);
        alert('Session created. The Session ID has been copied to your ClipBoard! You can share this id with your friends: ' + sessionId);

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

    sendToRuntime({action: 'leave-session', data: {sessionId: currentSessionId, userId: store.userId}});
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
        const data = {
            user: {
                mouseX: store.mouseX,
                mouseY: store.mouseY,
                id: store.userId,
                name: store.name,
                selectedText: store.selectedText,
                url: store.url,
                color: store.color,
            },
            sessionId: store.sessionId,
            userId: store.userId
        }

        sendToRuntime({action: 'start-session', data: data});
    }
}

//----------------------------------------------------------------
// Extension Messaging Service
//----------------------------------------------------------------

// Send a message to the current content script
export async function sendToCurrentContentScript(message = {action: '', data: null}) {
    try {
        browser.tabs.query({active: true, currentWindow: true}).then(async (tabs) => {
            if (tabs.length > 0 && /^https?:\/\//.test(tabs[0].url)) {
                console.log('sending to current tab though browser', tabs, message);
                return await browser.tabs.sendMessage(tabs[0].id, message);
            }
            console.log('no valid tab found');
        });
    } catch (e) {
        console.log(e)
    }
}

// Send a message to the background service
export async function sendToRuntime({action = '', data = null}, windowEvent = false) {
    try {
        console.log('sending to runtime from browser', action, data);

        if (windowEvent) {
            dispatchExtensionMessage(action, data);
        }

        return await browser.runtime.sendMessage({action, data});
    } catch (e) {
        console.log(e)
    }
}

// Send a message to all content scripts
export async function sendToAllContentScripts({action = '', data = null}, responseCallback = (result) => {
}) {
    try {
        await browser.tabs.query({}).then(async (tabs) => {
            console.log('sending to all content scripts though browser', tabs);
            for (const tab of tabs) {
                console.log('sending to tab though browser', tab);
                await browser.tabs.sendMessage(tab.id, {action, data}).then(responseCallback);
            }
        });
    } catch (e) {
        console.log(e)
    }
}

// Add a listener for messages from the extension runtime
export async function addExtensionMessageListener(action = 'update', callbackFn = (data) => {
}) {
    try {
        browser.runtime.onMessage.addListener(async (message, sender) => {
            if ('action' in message && message['action'] === action) {
                console.log('received runtime message from browser', message);
                callbackFn(message?.data ?? message);
            }
        });

        addEventListener(action, (data) => {
            console.log('received event message from window', data);
            callbackFn(data);
        });
    } catch (e) {
        console.log(e)
    }
}

export function dispatchExtensionMessage(action = '', data = {}) {
    const event = new CustomEvent(action, data);
    window.dispatchEvent(event);
}