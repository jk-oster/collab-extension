<template>
    <div class="col-ex-messages">
        <div>Messages</div>
        <div class="col-ex-message-container">
            <div v-for="message in messages" :key="message.id" :id="'msg-' + message.id" class="col-ex-message">
                <div class="col-ex-message-meta">
                    <span class="col-ex-badge-element" :style="'background-color: ' + getUserColor(message.user)">
                        {{ message.user }}
                    </span>
                    <span>{{ (new Date(message.date)).toLocaleDateString() }}</span>
                </div>
                <div class="col-ex-message-content" v-html="wrapUrls(message.text)"></div>
            </div>
        </div>
        <div class="col-ex-message-input">
            <label style="display: none;" for="newMessage">New message</label>
            <editor id="newMessage" class="col-ex-editor" v-model="newMessage"/>
            <!--        <input type="text" id="newMessage" v-model="newMessage" @keyup.enter="addMessage"/>-->
            <button @click="addMessage" class="col-ex-btn">Send message</button>
        </div>
    </div>
</template>

<script>
import {store} from "@/store";
import {addMessageToSession, getRandId} from "@/firebase";
import Editor from "@/components/Editor.vue";
import {addExtensionMessageListener, sendToRuntime} from "@/service";

export default {
    name: "Messages",
    components: {Editor},
    data() {
        return {
            newMessage: "",
        };
    },

    mounted() {
        addExtensionMessageListener('update-messages', this.scrollToMessageContainerBottom);
        this.scrollToMessageContainerBottom();
    },

    computed: {
        messages() {
            return store.messages.sort((a, b) => a.date - b.date);
        },
    },

    methods: {
        scrollToMessageContainerBottom() {
            const messageContainer = document.querySelector('.col-ex-message-container');
            messageContainer.scrollTop = messageContainer.scrollHeight;
        },

        addMessage() {
            if (this.newMessage && this.newMessage.length > 0 && this.newMessage !== '<p></p>') {
                const messageId = getRandId();
                const message = {
                    id: messageId ?? "",
                    user: store.name ?? "",
                    text: this.newMessage ?? "",
                    date: new Date().getTime() ?? 0,
                };

                sendToRuntime({
                    action: "add-message",
                    data: {
                        message,
                        sessionId: store.sessionId,
                        messageId,
                    }
                });

                store.messages = [...store.messages, message];

                this.newMessage = "";

                this.scrollToMessageContainerBottom();
            }
        },

        wrapUrls(text) {
            return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" class="col-ex-link" target="_blank">$1</a>');
        },

        getUserColor(user) {
            return store.users.find(u => u.name === user)?.color ?? '#f00';
        }
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
    margin-top: 10px;

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
    margin-right: 5px;
    margin-bottom: 5px;
    padding: 5px;
    border-radius: 5px;
    background-color: #232835;

    p {
      margin-top: 0.25em;
      margin-bottom: 0.25em;
    }

    > * + * {
      margin-top: 0.25em;
      margin-bottom: 0.25em;
    }

    &-meta {
      display: flex;
      justify-content: space-between;
      margin: 0 5px;
      font-size: 0.5em;
    }

    &-content {
      margin: 0 5px;
      font-size: 0.8em;
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
    margin-bottom: 5px;
    min-height: 2em;
    background-color: #fff;
    width: 100%;
    border: none;
    outline: none;
    padding: 0 5px;
    border-radius: 5px;

    .ProseMirror {
      min-height: 1em;
      width: 95%;
      background-color: #fff;
      color: #000;
      border: none;
      outline: none;
      padding-right: 5px;
      padding-left: 5px;
      padding-top: 2.5px;

      p {
        margin-top: 0.25em;
        margin-bottom: 0.25em;
      }

      > * + * {
        margin-top: 0.25em;
        margin-bottom: 0.25em;
      }

      code {
        background-color: rgba(#616161, 0.1);
        color: #616161;
      }
    }
  }

}


</style>