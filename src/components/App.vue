<template>
    <draggable type="fixed">
        <button class="col-ex-btn" @click="toggleOffCanvas">
            <icon name="eye"></icon>
            Toggle Sidebar
        </button>
    </draggable>

    <div :class="(store.showOffCanvas ? ' translate-x-0 ' : ' translate-x-full ') + ' popup-container'">
        <details>
            <summary class="col-ex-summary">
                <span>COLLAB EXT INFO:</span>
                <button class="col-ex-btn" @click="toggleOffCanvas">
                    <icon name="eye"></icon>
                    Hide Sidebar
                </button>
            </summary>
            <div>
                <div>
                    <button class="col-ex-btn" @click="copyToClipboard">
                        <icon name="paste"></icon>
                        Copy Session ID
                    </button>
                    <button class="col-ex-btn" @click="setName">
                        <icon name="pencil"></icon>
                        Set name

                    </button>
                    <button class="col-ex-btn" @click="deleteCurrentSession">
                        <icon name="bin"></icon>
                        Delete Session
                    </button>
                </div>
                <div>Session: "{{ store.sessionId }}"</div>
                <div>User: "{{ store.userId }}"</div>
                <div>Name: "{{ store.name }}"</div>
                <div>Update Interval: "{{ store.updateInterval }}ms"</div>
                <div>Sync On: "{{ store.syncOn }}"</div>
                <div>Show Self: "{{ store.showSelf }}"</div>
                <div>Cursor Size: "{{ store.cursorSize }}px"</div>
                <div>{{ store.positionType }}X: "{{ (store.mouseX * windowTotalWidth).toFixed(0) }}"</div>
                <div>{{ store.positionType }}Y: "{{ (store.mouseY * windowTotalHeight).toFixed(0) }}"</div>
                <div>
                    <span>Users:</span>
                    <ul>
                        <li v-for="user of store.users">
                            {{ user.id }}: <span>{{ user.name.slice(0,10) }}</span> - <a href="{{ user.url }}">{{ user.url.slice(0,25) }}</a>
                        </li>
                    </ul>
                </div>
            </div>
        </details>

        <template v-if="store.sessionId">
            <user-scroll-follow :users="usersToDisplay"></user-scroll-follow>
            <shapes v-if="store.sessionId && store.name"></shapes>
            <messages v-if="store.sessionId && store.name"></messages>
        </template>
        <template v-else>
            <button class="col-ex-btn" @click="createSession">
                <icon name="users"></icon>
                Create session
            </button>
            <button class="col-ex-btn" @click="joinSession">
                <icon name="user-plus"></icon>
                Join session
            </button>
        </template>


    </div>

    <user-cursor :users="usersToDisplay"></user-cursor>

</template>

<script>
import {saveToExtStorageAnd, store} from "@/store";
import {
    addExtensionMessageListener,
    copyToClipboard, deleteCurrentSession,
    dispatchExtensionMessage, getWindowTotalHeight,
    setName
} from "@/service";
import UserCursor from "@/components/UserCursor.vue";
import UserScrollFollow from "@/components/UserScrollFollow.vue";
import {initService} from "@/service";
import Messages from "@/components/Messages.vue";
import Shapes from "@/components/Shapes.vue";
import Icon from "@/components/Icon.vue";
import Draggable from "@/components/Draggable.vue";

export default {
    name: "App",
    components: {Icon, Shapes, Messages, UserScrollFollow, UserCursor, Draggable},

    async mounted() {
        await initService();

        addExtensionMessageListener('toggle-sidebar', this.toggleOffCanvas);
    },

    computed: {
        usersToDisplay() {
            if (store.showSelf) return store.users;
            return store.users.filter(user => user.id !== store.userId);
        },

        store() {
            return store;
        },

        windowTotalHeight() {
            return getWindowTotalHeight();
        },

        windowTotalWidth() {
            return window.innerWidth;
        }
    },
    methods: {
        getWindowTotalHeight,
        deleteCurrentSession,
        setName,
        copyToClipboard,
        createSession() {
            dispatchExtensionMessage('create-session');
        },

        joinSession() {
            dispatchExtensionMessage('join-session');
        },

        toggleOffCanvas() {
            store.showOffCanvas = !store.showOffCanvas;

            saveToExtStorageAnd(store, 'showOffCanvas', store.showOffCanvas);
        }
    }
}

</script>

<style lang="scss">
html {
  scroll-behavior: smooth;
}

.col-ex {
  &-btn {
    height: 2em;
    padding: 0.25rem 0.75rem;
    min-height: 2em;
    font-size: 1rem;
    border: 1px solid transparent;
    display: inline-flex;
    cursor: pointer;
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

    & > svg {
      margin-right: 0.25rem;
    }

    &:hover {
      background-color: #000000;
      color: #ffffff;
    }
  }

  &-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &-selected-text {
    background-color: rgba(255, 242, 0, 0.7);
  }

  &-fixed {
    position: fixed;
    top: 60px;
    right: 60px;
    z-index: 9999;
  }

  &-avatar {
    align-items: center;
    display: inline-flex;
    justify-content: center;

    background-color: #d1d5db;
    color: #fff;

    border-radius: 50%;
    height: 3rem;
    width: 3rem;
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1;
    overflow: hidden;
    text-align: center;
    text-transform: uppercase;
  }
}

.translate-x-0 {
  transform: translateX(0);
}

.translate-x-full {
  transform: translateX(100%);
}

.duration-300 {
  animation-duration: 300ms;
}

.ease-in-out {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.popup-container,
.popup-button {
  z-index: 99999;
}

.popup-container {
  overflow: auto;
  position: fixed;
  top: 0;
  right: 0;
  padding: 1rem;
  background-color: #10151f;
  color: #dddddd;
  transition-duration: 300ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 100vh;
  border-radius: 0.25rem;
  min-width: 350px;
  font-feature-settings: normal;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, apple color emoji, segoe ui emoji, Segoe UI Symbol, noto color emoji;
  font-size: 1rem;
}


.col-ex-dropdown {
  position: relative;
  display: inline-block;
  margin-left: 0.5rem;
  margin-right: 0.5rem;

  tab-size: 4;
  font-feature-settings: normal;
  color-scheme: dark;
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
  border-color: #e5e7eb;
  margin-bottom: 8rem;

  &-menu {
    :where(& li) {
      position: relative;
      display: flex;
      flex-shrink: 0;
      flex-direction: column;
      flex-wrap: wrap;
      align-items: stretch;
    }
  }

  &-content {
    tab-size: 4;
    font-size: 1rem;
    line-height: 1.75;
    box-sizing: border-box;
    border-width: 0;
    border-style: solid;
    border-color: #e5e7eb;
    list-style: none;
    margin: 0;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    width: 13rem;
    padding: .5rem;
    visibility: hidden;
    position: absolute;
    z-index: 50;
    opacity: 0;
    transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-text-decoration-color, -webkit-backdrop-filter;
    transition-duration: .2s;
    transition-timing-function: cubic-bezier(.4, 0, .2, 1);
    right: 0;
    bottom: auto;
    top: 100%;
    transform-origin: top;
  }
}

</style>