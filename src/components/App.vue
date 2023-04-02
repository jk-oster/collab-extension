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

  <div :class="(store.showOffCanvas ? ' translate-x-0 ' : ' translate-x-full ') + ' popup-container'">
    <user-scroll-follow :users="usersToDisplay"></user-scroll-follow>
    <shapes></shapes>
    <messages></messages>
  </div>

  <user-cursor :users="usersToDisplay"></user-cursor>

</template>

<script>
import {saveToExtStorageAnd, store} from "@/store";
import {addExtensionMessageListener} from "@/service";
import UserCursor from "@/components/UserCursor.vue";
import UserScrollFollow from "@/components/UserScrollFollow.vue";
import {initService} from "@/service";
import Messages from "@/components/Messages.vue";
import Shapes from "@/components/Shapes.vue";

export default {
  name: "App",
  components: {Shapes, Messages, UserScrollFollow, UserCursor},

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
  },
  methods: {
    toggleOffCanvas() {
      saveToExtStorageAnd(store, 'showOffCanvas', !store.showOffCanvas);
    }
  }
}

</script>

<style>
html {
  scroll-behavior: smooth;
}

.col-ex-selected-text {
  background-color: rgba(255, 242, 0, 0.7);
}

.col-ex-fixed {
  position: fixed;
  top: 60px;
  right: 60px;
  z-index: 9999;
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
  padding: 0.5rem;
  background-color: #111827;
  transition-duration: 300ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 100vh;
  border-radius: 0.25rem;
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