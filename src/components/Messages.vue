<template>
  <div class="col-ex-message-container">
    <div v-for="message in messages" :key="message.id" :id="message.id" class="col-ex-message">
      <div>{{ message.text }}</div>
      <div><span>{{ message.user }}</span><span>{{ message.date }}</span></div>
    </div>
  </div>
  <div>
    <label for="newMessage">New message</label>
    <input type="text" id="newMessage" v-model="newMessage"/>
    <button @click="addMessage">Add</button>
  </div>
</template>

<script>
import {store} from "@/store";
import {addMessageToSession, getRandId} from "@/firebase";

export default {
  name: "Messages",
  data() {
    return {
      messages: store.messages ?? [],
      newMessage: "",
    };
  },

  methods: {
    addMessage() {
      const messageId = getRandId();
      addMessageToSession({
        id: messageId ?? "",
        user: store.name ?? "",
        text: this.newMessage ?? "",
        date: new Date().getTime() ?? 0,
      }, messageId, store.sessionId);
      this.newMessage = "";
    },
  },
}
</script>

<style scoped>

</style>