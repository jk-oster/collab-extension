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
        Scroll to "{{ user.name }}"
      </button>
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
      interval: 0,
    }
  },

  async mounted() {
    console.log('App mounted');

    // Load all data from extension storage to store (settings, userId, sessionId, name)
    await loadAllFromExtStorageTo(store);

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

    // Add listeners for extension messages
    addExtensionMessageListener('restart-interval', (message) => {
      console.log('restart-interval', message);
      this.restartInterval()
    });
    addExtensionMessageListener('join-session', (message) => {
      console.log('join-session', message);
      this.joinSession()
    });
    addExtensionMessageListener('create-session', (message) => {
      console.log('create-session', message);
      this.createSession()
    });
    addExtensionMessageListener('leave-session', (message) => {
      if (message) console.log('leave-session', message);
      this.deleteCurrentSession(message)
    });
    addExtensionMessageListener('copy-to-clipboard', (message) => {
      console.log('copy-to-clipboard', message);
      // Set focus on the document again through alert before copying to enable copy to clipboard
      alert('Session ID copied to clipboard!');
      this.copyToClipboard(store.sessionId)
    });
    addExtensionMessageListener('set-name', (message) => {
      console.log('set-name', message);
      this.setName();
    });

    // Synchronize position with firebase
    this.restartInterval();

    // If user is in a session, join it
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

    scrollToUser(user) {
      console.log('scroll-to-user', user);
      window.scrollTo(user.mouseX, user.mouseY - (window.innerHeight / 2));
    },

    copyToClipboard(text = '') {
      console.log('copy-to-clipboard', text);
      navigator.clipboard.writeText(text);
    },

    restartInterval() {
      clearInterval(this.interval);

      console.log('restart-interval', store);

      let oldPosition = {
        mouseX: store.mouseX,
        mouseY: store.mouseY,
      };

      // Check if position has changed
      const changedPosition = () => {
        if (oldPosition.mouseX !== store.mouseX || oldPosition.mouseY !== store.mouseY) {
          oldPosition = {
            mouseX: store.mouseX,
            mouseY: store.mouseY,
          };
          return true;
        }
        return false;
      };

      // Interval to not spam firebase with updates
      this.interval = setInterval(() => {
        // If user is in a session and cursor position has changed update position
        if (store.sessionId && store.userId && store.name && changedPosition() && store.syncOn) {
          // Sync cursor position with firebase
          updatePosition({
            mouseX: store.mouseX,
            mouseY: store.mouseY,
            id: store.userId,
            name: store.name
          }, store.sessionId, store.userId);
        }
      }, 500);
    },

    saveSettings() {
      saveToExtStorageFrom(store);
    },

    getPositionStyle(user) {
      return "top: " + user.mouseY + "px; left: " + user.mouseX + "px;";
    },

    // Create new session in firebase and join it
    createSession() {
      console.log('Create new Session');
      addNewSession().then(session => {
        saveToExtStorageAnd(store, 'sessionId', session.id);
        this.copyToClipboard(session.id);
        alert('Session created. The Session ID has been copied to your ClipBoard! You can share this id with your friends: ' + session.id);
        this.joinSession();
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

    // Join session in firebase
    joinSession() {
      console.log('Trying to join Session');

      // If no name is set, prompt user to set one
      if (!store.name) {
        const name = prompt('Enter your name');
        saveToExtStorageAnd(store, 'name', name);
      }

      // If no session id is set, prompt user to set one
      const sessionId = prompt('Enter session id');
      saveToExtStorageAnd(store, 'sessionId', sessionId);

      this.startSession();
    },

    startSession() {
      if (store.sessionId) {
        // Add user to session in firebase
        addUserToSession({
          mouseX: store.mouseX,
          mouseY: store.mouseY,
          id: store.userId,
          name: store.name
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