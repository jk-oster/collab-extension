<template>
  <div>
    <div>
      <span>COLLAB EXT INFO: </span>
      <span>Session: "{{ store.sessionId }}" </span>
      <span>User: "{{ store.userId }}" </span>
      <span>Name: "{{ store.name }}" </span>
      <span>Update Interval: "{{ store.updateInterval }}ms" </span>
      <span>Sync On: "{{ store.syncOn }}" </span>
      <span>Show Self: "{{ store.showSelf }}" </span>
      <span>Cursor Size: "{{ store.cursorSize }}px" </span>
      <span>{{ store.positionType }}X: "{{ store.mouseX }}" </span>
      <span>{{ store.positionType }}Y: "{{ store.mouseY }}" </span>
    </div>
  </div>

  <div class="col-ex-fixed ">
    <template v-for="user in usersToDisplay">
      <button class="col-ex-btn" @click="scrollToUser(user)">
        Scroll to {{ user.name }}
      </button>
      <button class="col-ex-btn" @click="toggleFollow(user)">
        Follow {{ user.name }}
      </button>
      <a v-if="!onSameUrl(user.url)" class="col-ex-btn" :href="user.url" target="_blank">
        Open {{ user.name }}'s page
      </a>
    </template>
  </div>

  <template v-for="user in usersToDisplay">
    <div class="col-ex-movable-element" :style="getPositionStyle(user)">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.125 -0.125 14.25 14.25" :height="store.cursorSize"
           :width="store.cursorSize" stroke-width="1.25">
        <path d="M13.15,5.45a.5.5,0,0,0,0-1L1.83.56A1,1,0,0,0,.56,1.83L4.5,13.16a.5.5,0,0,0,1,0L7.5,7.5Z" fill="#ffffff"
              stroke="#000000" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
      <div class="col-ex-badge-element">
        <span>{{ user.name }}</span>
      </div>
    </div>
  </template>
</template>

<script>
import {addNewSession, addUserToSession, deleteSession, getRandId, initUsers, updatePosition} from "@/firebase";
import {
  addExtensionMessageListener,
  initStorageListeners,
  loadAllFromExtStorageTo,
  saveToExtStorageAnd,
  saveToExtStorageFrom,
  store
} from "@/store";

export default {
  name: "App",

  data() {
    return {
      // ID of the interval that updates the position of the user
      interval: 0,
      userToFollow: '',
    }
  },

  async mounted() {
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
      const selectedText = this.getSelectionText();
      if (selectedText) {
        store.selectedText = selectedText
      }
      store.url = window.location.href;
    });

    addEventListener("positions-updated", this.markSelectionsOfUsers);

    // Add listeners for extension messages from popup, options or background
    addExtensionMessageListener('restart-interval', this.restartInterval);
    addExtensionMessageListener('join-session', this.joinSession);
    addExtensionMessageListener('create-session', this.createSession);
    addExtensionMessageListener('leave-session', this.deleteCurrentSession);
    addExtensionMessageListener('set-name', this.setName);
    addExtensionMessageListener('copy-to-clipboard', (message) => {
      console.log('copy-to-clipboard', message);
      // Set focus on the document again through alert before copying to enable copy to clipboard
      alert('Session ID copied to clipboard!');
      this.copyToClipboard(store.sessionId)
    });

    // Synchronize position with firebase
    this.restartInterval();

    // Follow user by scrolling to it if userToFollow is set
    setInterval(() => {
      if (this.userToFollow) {
        const user = store.users.find(user => user.name === this.userToFollow);
        if (user) {
          this.scrollToUser(user);
        }
      }
    }, 300);

    // If user is already in a session, join it again
    if (store.sessionId && store.userId && store.name) {
      this.startSession();
    }
  },

  computed: {
    usersToDisplay() {
      if (store.showSelf) return store.users;
      return store.users.filter(user => user.id !== store.userId);
    },

    store() {
      return store;
    },
  },

  methods: {

    // Scroll window to center of the position of defined user
    scrollToUser(user) {
      console.log('scroll-to-user', user);
      window.scrollTo(user.mouseX, user.mouseY - (window.innerHeight / 2));
    },

    toggleFollow(user) {
      if (this.userToFollow === user.name) {
        this.userToFollow = '';
      } else {
        this.userToFollow = user.name;
      }
    },

    // Copy text to clipboard
    copyToClipboard(text = '') {
      console.log('copy-to-clipboard', text);
      navigator.clipboard.writeText(text);
    },

    // Set the coordinates of the user as style properties
    getPositionStyle(user) {
      return "top: " + user.mouseY + "px; left: " + user.mouseX + "px;";
    },

    onSameUrl(url) {
      return url === window.location.href;
    },

    getSelectionText() {
      let text = "";
      if (window.getSelection) {
        text = window.getSelection().toString();
      } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
      }
      return text;
    },

    markSelectionsOfUsers() {
      console.log('mark-selection');
      // this.removeMarkedSelection();
      const selectedTexts = store.users.map(user => user.selectedText);
      selectedTexts.forEach(selectedText => {
        console.log(selectedText);
        if (selectedText) {
          // Wrap selected text in span
          // this.highlightTextOccurrences(selectedText);
        }
      });
    },

    highlightTextOccurrences(text) {
      const regex = new RegExp(text, 'gi');
      document.querySelectorAll('*').forEach((element) => {
        Array.from(element.childNodes).forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const matches = node.textContent.match(regex);
            if (matches) {
              const fragment = document.createDocumentFragment();
              matches.forEach((match) => {
                const span = document.createElement('span');
                span.classList.add('col-ex-selected-text');
                span.textContent = match;
                fragment.appendChild(span);
              });
              node.parentNode.insertBefore(fragment, node);
            }
          }
        });
      });
    },

    // Remove previous marked selection
    removeMarkedSelection() {
      const markedSelection = window.document.querySelector('.col-ex-selected-text');
      if (markedSelection) {
        markedSelection.outerHTML = markedSelection.innerHTML;
      }
    },

    // Start an interval updating the position of the user in the session
    restartInterval() {
      console.log('restart-interval', store);

      // Clear old interval if it exists
      clearInterval(this.interval);

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
      this.interval = setInterval(() => {
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
          }, store.sessionId, store.userId);
        }
      }, 500);
    },

    // Save store to extension storage
    saveSettings() {
      saveToExtStorageFrom(store);
    },

    // Create new session in firebase and join it
    createSession() {
      console.log('Create new Session');
      addNewSession().then(session => {
        saveToExtStorageAnd(store, 'sessionId', session.id);
        this.copyToClipboard(session.id);
        alert('Session created. The Session ID has been copied to your ClipBoard! You can share this id with your friends: ' + session.id);

        if (!store.name) {
          this.setName();
        }

        this.startSession();
      });
    },

    // Delete session in firebase, store, extension storage and leave it
    deleteCurrentSession() {
      console.log('Deleting and leaving current Session');
      const currentSessionId = store.sessionId;
      saveToExtStorageAnd(store, 'sessionId', '');
      deleteSession(currentSessionId);
    },

    // Set name in store and extension storage
    setName() {
      console.log('setName');
      const name = prompt('Enter your name');
      if (name) {
        saveToExtStorageAnd(store, 'name', name);
      }
    },

    // Give user the option to enter a session id and join it
    joinSession() {
      console.log('Trying to join Session');

      // If no name is set, prompt user to set one
      if (!store.name) {
        this.setName();
      }

      // Prompt user to enter session id
      const sessionId = prompt('Enter session id');
      saveToExtStorageAnd(store, 'sessionId', sessionId);

      this.startSession();
    },

    // Add user to session in firebase
    startSession() {
      if (store.sessionId) {
        addUserToSession({
          mouseX: store.mouseX,
          mouseY: store.mouseY,
          id: store.userId,
          name: store.name,
          selectedText: store.selectedText,
          url: store.url,
        }, store.sessionId, store.userId).then(() => {

          console.log('Successfully joined session');
          // start listening to changes in users positions and update the store
          // store state updates UI
          initUsers(store.sessionId).then(() => {
            console.log('Successfully initialized users', store.users);
          });
        });
      }
    }
  },
}

</script>

<style scoped>
html {
  scroll-behavior: smooth;
}

.col-ex-selected-text {
  background-color: rgba(255, 242, 0, 0.7);
}

.col-ex-movable-element {
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
  width: 15px;
  height: 15px;
  z-index: 9999;
  transition: all 0.5s ease-in-out;
}

.col-ex-fixed {
  position: fixed;
  top: 60px;
  right: 60px;
  z-index: 9999;
}

.col-ex-badge-element {
  display: inline-block;
  background-color: #007bff;
  color: #fff;
  padding: 3px 6px;
  border-radius: 10px;
  font-size: 8px;
  font-weight: bold;
}

.col-ex-btn {
  height: 1.5rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  min-height: 1.5rem;
  font-size: .75rem;

  border: 1px solid white;
  text-transform: uppercase;
  display: inline-flex;
  flex-shrink: 0;
  cursor: pointer;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-text-decoration-color, -webkit-backdrop-filter;
  transition-duration: .2s;
  transition-timing-function: cubic-bezier(.4, 0, .2, 1);
  border-radius: .5rem;
  line-height: 1em;
  font-weight: 600;
  text-decoration-line: none;
  animation: button-pop .25s ease-out;
  background-color: #222222;
  color: #dddddd;
}
</style>