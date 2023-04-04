<template>

  <template v-for="user in users">
<!--    <teleport >-->
      <div v-if="onSameUrl(user.url)" class="col-ex-movable-element" :style="getPositionStyle(user)" :id="'cursor-' + user.id">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.125 -0.125 14.25 14.25" :height="store.cursorSize"
             :width="store.cursorSize" stroke-width="1.25">
          <path d="M13.15,5.45a.5.5,0,0,0,0-1L1.83.56A1,1,0,0,0,.56,1.83L4.5,13.16a.5.5,0,0,0,1,0L7.5,7.5Z"
                fill="#ffffff"
                stroke="#000000" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
        <div class="col-ex-badge-element" :style="'background-color: ' + user.color">
          <span>{{ user.name }}</span>
        </div>
      </div>
<!--    </teleport>-->
  </template>

</template>

<script>

import {store} from "@/store";

export default {
  name: "UserCursor",
  props: ['users'],
  computed: {
    store() {
      return store;
    },
  },
  methods: {
    // Set the coordinates of the user as style properties
    getPositionStyle(user) {
      return "top: " + user.mouseY + "px; left: " + user.mouseX + "px;";
    },

    onSameUrl(url) {
      return url === window.location.href;
    },
  }
}
</script>

<style scoped>
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

.col-ex-badge-element {
  display: inline-block;
  background-color: #007bff;
  color: #fff;
  padding: 3px 6px;
  border-radius: 10px;
  font-size: 8px;
  font-weight: bold;
}
</style>