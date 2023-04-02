<template>
  <template v-for="user in users">
    <div>
      <button v-if="onSameUrl(user.url)" class="col-ex-btn" @click="scrollTo(user)">
        Scroll to {{ user.name }}
      </button>
      <button v-if="onSameUrl(user.url)" class="col-ex-btn" @click="toggleFollow(user)">
        Follow {{ user.name }}
      </button>
      <a v-if="!onSameUrl(user.url)" class="col-ex-btn" :href="user.url" target="_blank">
        Open {{ user.name }}'s page
      </a>
    </div>
  </template>
</template>

<script>
import {store} from "@/store";
import {scrollToUser} from "@/service";

export default {
  name: "UserScrollFollow",
  props: ['users'],
  methods: {
    // Scroll window to center of the position of defined user
    scrollTo(user) {
      scrollToUser(user);
    },

    toggleFollow(user) {
      if (store.userToFollow === user.id) {
        store.userToFollow = '';
      } else {
        store.userToFollow = user.id;
      }
    },

    onSameUrl(url) {
      return url === window.location.href;
    },
  }
}
</script>

<style scoped>

</style>