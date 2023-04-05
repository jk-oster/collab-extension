<template>
    <div class="translate-y-full col-ex-container">
        <div>
            <div>
                <strong>Cursor-Collaboration-Extension Options</strong>
            </div>
            <div>by Jakob Osterberger</div>
        </div>

        <div>
            <div>
                <label for="syncOn">
                    Sync on
                    <input id="syncOn" name="syncOn" v-model="store.syncOn" type="checkbox" @change="saveSettings()"/>
                </label>
            </div>
            <div>
                <button class="col-ex-btn" @click="toggleSidebar()"><icon name="eye"></icon> Toggle sidebar</button>
            </div>

            <div>
                <button class="col-ex-btn" @click="createSession()"><icon name="users"></icon> Create New Session</button>
            </div>

            <div>
                <button class="col-ex-btn" @click="deleteCurrentSession()"><icon name="bin"></icon> Delete Session</button>
            </div>
            <div>

                <button class="col-ex-btn" @click="joinSession()"><icon name="user-plus"></icon> Join Session</button>
            </div>
            <div>

                <button class="col-ex-btn" @click="copyToClipboard()"><icon name="paste"></icon> Copy session ID</button>
            </div>
            <div>

                <button class="col-ex-btn" @click="setName()"><icon name="pencil"></icon> Set Name</button>
            </div>

            <div>
                <label for="color">
                    User color
                    <input type="color" id="color" name="color" v-model="store.color" @change="saveSettings()"/>
                </label>
            </div>
            <div>
                <label for="updateInterval">
                    Update interval
                    <select id="updateInterval" name="updateInterval" v-model="store.updateInterval"
                            @change="restartInterval()">
                        <option value="50">50ms</option>
                        <option value="100">100ms</option>
                        <option value="300">300ms</option>
                        <option value="500">500ms</option>
                        <option value="1000">1s</option>
                        <option value="2000">2s</option>
                    </select>
                </label>
            </div>
            <div>
                <label for="positionType">
                    Position detection type
                    <select id="positionType" name="positionType" v-model="store.positionType" @change="saveSettings()">
                        <option value="client">client</option>
                        <option value="screen">screen</option>
                        <option value="layer">layer</option>
                        <option value="page">page</option>
                        <option value="offset">offset</option>
                    </select>
                </label>
            </div>
            <div>
                <label for="showSelf">
                    Show own cursor
                    <input id="showSelf" name="showSelf" v-model="store.showSelf" type="checkbox"
                           @change="saveSettings()"/>
                </label>
            </div>
            <div>
                <label for="cursorSize">
                    Cursor size
                    <input id="cursorSize" max="150" name="cursorSize" v-model="store.cursorSize" type="number"
                           @change="saveSettings()"/>
                </label>
            </div>
        </div>

    </div>
</template>

<script>
import {
    loadAllFromExtStorageTo,
    saveToExtStorageFrom,
} from "@/store";
import {
    sendToAllContentScripts,
    sendToCurrentContentScript
} from "@/service"
import Icon from "@/components/Icon.vue";

export default {
    name: "Popup",
    components: {Icon},

    data() {
        return {
            store: {
                syncOn: false,
                updateInterval: 500,
                positionType: "page",
                showSelf: true,
                cursorSize: 20,
                sessionId: "",
                name: "",
            },
        }
    },

    mounted() {
        // Load all saved settings from extension storage to store
        loadAllFromExtStorageTo(this.store);
    },

    methods: {
        saveSettings() {
            console.log('Saving settings');
            saveToExtStorageFrom(this.store);
        },

        toggleSidebar() {
            sendToCurrentContentScript({action: 'toggle-sidebar'});
        },

        restartInterval() {
            console.log('Restarting interval');
            this.saveSettings();
            setTimeout(() => {
                sendToCurrentContentScript({action: 'restart-interval', updateInterval: this.store.updateInterval});
            }, 300);
        },

        copyToClipboard() {
            console.log('Copy to clipboard');
            sendToCurrentContentScript({action: 'copy-to-clipboard', text: this.store.sessionId});
        },

        // Create new session in firebase and join it
        createSession() {
            console.log('Create new Session');
            sendToAllContentScripts({action: 'create-session'});
        },

        // Delete session in firebase, store, extension storage and leave it
        deleteCurrentSession() {
            console.log('Deleting and leaving current Session');
            sendToCurrentContentScript({action: 'leave-session', sessionId: this.store.sessionId});
        },

        // Set name in store and extension storage
        setName() {
            console.log('setName');
            sendToCurrentContentScript({action: 'set-name', name: this.store.name});
        },

        // Join session in firebase
        joinSession() {
            console.log('Joining Session');
            sendToCurrentContentScript({action: 'join-session', sessionId: this.store.sessionId});
        }
    }
}
</script>

<style scoped lang="scss">
html {
    scroll-behavior: smooth;
}

.col-ex {
    &-btn {
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

        &:hover {
            background-color: #000000;
            color: #ffffff;
        }
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

.translate-y-0 {
    transform: translateY(0);
}

.translate-y-full {
    transform: translateY(100%);
}

.duration-300 {
    animation-duration: 300ms;
}

.ease-in-out {
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.col-ex-container {
    padding: 1rem;
    background-color: #10151f;
    color: #dddddd;
    min-width: 300px;
    border-radius: 0.25rem;
    transition-duration: 150ms;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

</style>