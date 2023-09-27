# Collaborative Browser Extension Prototype

This is a prototype for a collaborative browser extension. This proof of concept aims to demonstrate the possibilities of collaborative browsing using web extensions and to provide a starting point for further development. 
It was created as part of a bachelor thesis of the course [Communication, Knowledge, Media](https://www.fh-ooe.at/en/campus-hagenberg/studiengaenge/bachelor/kommunikation-wissen-medien/) at the [University of Applied Sciences Upper Austria](https://www.fh-ooe.at/en/).
The extension is based on the [WebExtensions API](https://developer.mozilla.org/en-US/Add-ons/WebExtensions) and uses [Firebase](https://firebase.google.com/) as a backend. The content script application is implemented using [Vue](https://vuejs.org/). 
The extension is currently in an early stage and is not intended for production use. 
The extension should work on both Chrome and Firefox by using the [web extension polyfill](https://github.com/mozilla/webextension-polyfill).

## Features
- create collaborative browsing sessions
- join a session by entering a session ID
- displays the cursor of other users on the page
- follow the cursor of another user on a page
- jump to the current cursor position of another user
- draw shapes on a page to mark areas & synchronize them with other users
- write chat messages with other users
- select text & synchronize the selection with other users
- jump to the page another user is currently on

## Installation & Getting started
1. Clone the repository
2. Install the dependencies with `npm install` or `pnpm install`
3. Create a [Firebase](https://firebase.google.com/) project and add a web app
4. Copy the Firebase configuration from the Firebase console and paste it into the `firebase` variable in the file `firebase.js`.
3. Build the extension with `npm run build` or `pnpm install` (to build the extension on file change run `npm run dev` or `pnpm run dev`)
4. Load the `dist` folder of the extension in Firefox or Chrome and activate the extension
5. Open a website and let the extension initialize (wait a second or two...)
5. Open the extension popup and click on "Create Session"
6. Share the session ID with your friends
7. Your friends can join the session by clicking on "Join Session" and entering the session ID
8. The extension will now synchronize the current **cursor positions, chat messages, drawn shapes & selected text** with your friends
9. Enjoy collaborative browsing!

## Overview of the extension
The extension consists of three parts: the background script, the popup script and the content script. 
- The background script is responsible for the communication & synchronization with Firebase. It is responsible for creating a new session, joining a session, sending & receiving data and handling errors.
- The popup script is responsible for displaying the settings of the extension and handling user input.
- The content script is responsible for displaying the session data (cursors, messages, shapes, selections) and handling user input.

The settings of the extension are stored and persisted using the [browser.storage.sync API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/sync).

## Known issues
- The extension does probably not work on all browsers. It has only been tested on Chrome 111.
- Styling of the extension sidebar menu is sometimes broken by css of the website the extension is loaded on.
- If the extension popup is opened too early (before the content script has initialized), the extension may will not work properly and throws an error message.
- If the option "Service Worker - Reload on update" is enabled in the Chrome developer console (tab application), the extension will not work properly.

## Author
The author of this extension is [Jakob Osterberger](https://jkoster.com). Special thanks to my supervisor [FH-Prof. DI (FH) Dr. Johannes Schönböck](https://pure.fh-ooe.at/de/persons/johannes-sch%C3%B6nb%C3%B6ck) for his support and guidance.

## Accompanying bachelor thesis
The accompanying bachelor thesis can be found [here](). It contains a detailed description of the extension and its impleme