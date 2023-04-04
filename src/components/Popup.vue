<template>
    <div>
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
                <button class="col-ex-btn" @click="toggleSidebar()">Toggle sidebar</button>
            </div>

            <div>
                <button class="col-ex-btn" @click="createSession()">Create New Session</button>
            </div>

            <div>
                <button class="col-ex-btn" @click="deleteCurrentSession()">Delete Session</button>
            </div>
            <div>

                <button class="col-ex-btn" @click="joinSession()">Join Session</button>
            </div>
            <div>

                <button class="col-ex-btn" @click="copyToClipboard()">Copy session ID</button>
            </div>
            <div>

                <button class="col-ex-btn" @click="setName()">Set Name</button>
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

export default {
    name: "Popup",

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

<style scoped>

</style>