<template>
  <div class="col-ex-message-container">
    <div v-for="message in messages" :key="message.id" :id="'msg-' + message.id" class="col-ex-message">
      <div v-html="wrapUrls(message.text)"></div>
      <div class="col-ex-message-meta"><span>{{ message.user }}</span><span>{{ (new Date(message.date)).toLocaleDateString() }}</span></div>
    </div>
  </div>
  <div class="col-ex-message-input">
    <label style="display: none;" for="newMessage">New message</label>
    <input type="text" id="newMessage" v-model="newMessage" @keyup.enter="addMessage"/>
    <button @click="addMessage" class="col-ex-btn">Send</button>
  </div>
</template>

<script>
import {store} from "@/store";
import {addMessageToSession, getRandId} from "@/firebase";

export default {
  name: "Messages",
  data() {
    return {
      newMessage: "",
    };
  },

  computed: {
    messages() {
      return store.messages.sort((a, b) => a.date - b.date);
    },
  },

  methods: {
    addMessage() {
      if (this.newMessage) {
        const messageId = getRandId();
        addMessageToSession({
          id: messageId ?? "",
          user: store.name ?? "",
          text: this.newMessage ?? "",
          date: new Date().getTime() ?? 0,
        }, messageId, store.sessionId);
        this.newMessage = "";
      }
    },

    wrapUrls(text) {
      return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" class="col-ex-link" target="_blank">$1</a>');
    },
  },
}
</script>

<style>

.col-ex-message-container {
  overflow-y: scroll;
  max-height: 400px;
}

.col-ex-message {
  border: 1px solid black;
  margin: 5px;
  padding: 5px;
}

.col-ex-message-input {
  margin: 5px;
  min-width: 100px;
  display: flex;
  justify-content: space-between;
}

.col-ex-message-input > input {
  width: 75%;
}

.col-ex-message > .col-ex-message-meta {
  display: flex;
  justify-content: space-between;
  margin: 0 5px;
  font-size: 0.5em;
}

.col-ex-link {
  color: blue;
  text-decoration: underline;
}

</style>