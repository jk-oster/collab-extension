<template>
    <div class="col-ex-messages">

        <div class="col-ex-message-container">
            <div v-for="message in messages" :key="message.id" :id="'msg-' + message.id" class="col-ex-message">
                <div v-html="wrapUrls(message.text)"></div>
                <div class="col-ex-message-meta"><span>{{
                    message.user
                    }}</span><span>{{ (new Date(message.date)).toLocaleDateString() }}</span></div>
            </div>
        </div>
        <div class="col-ex-message-input">
            <label style="display: none;" for="newMessage">New message</label>
            <editor id="newMessage" class="col-ex-editor" v-model="newMessage"/>
            <!--        <input type="text" id="newMessage" v-model="newMessage" @keyup.enter="addMessage"/>-->
            <button @click="addMessage" class="col-ex-btn">Send</button>
        </div>
    </div>
</template>

<script>
import {store} from "@/store";
import {addMessageToSession, getRandId} from "@/firebase";
import Editor from "@/components/Editor.vue";

export default {
    name: "Messages",
    components: {Editor},
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
            if (this.newMessage && this.newMessage.length > 0 && this.newMessage !== '<p></p>') {
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

<style lang="scss">

.col-ex {
  &-message-container {
    overflow-y: scroll;
    max-height: 400px;
    margin-top: 5px;
  }

&-messages {
    p, ul, ol, h1, h2, h3, h4, h5, code, pre {
        margin-top: 0.25em;
        margin-bottom: 0.25em;
    }
    li {
        margin-top: 0.05em;
        margin-bottom: 0.05em;
    }
  }

  &-message {
    border: 1px solid #ccc;
    margin-right: 5px;
    margin-bottom: 5px;
    padding: 5px;
    border-radius: 5px;

    &-meta {
      display: flex;
      justify-content: space-between;
      margin: 0 5px;
      font-size: 0.5em;
    }

    &-input > input {
      width: 75%;
    }
  }

  &-link {
    color: #009dff;

    &:hover {
      text-decoration: underline;
    }
  }

  &-editor {
    margin-top: 0;
    margin-bottom: 0;
    min-height: 1em;
    background-color: #fff;
    width: 100%;
  }

}

.ProseMirror {
  min-height: 1em;
  width: 100%;
  background-color: #fff;
  color: #000;
  border: none;
  outline: none;
  padding: 0 5px;

  > * + * {
    margin-top: 0.75em;
  }

  code {
    background-color: rgba(#616161, 0.1);
    color: #616161;
  }
}


</style>