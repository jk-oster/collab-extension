var browser = require("webextension-polyfill");

import { createApp } from 'vue'
import App from "@/components/App.vue";
import "@/style/main.css";

const MOUNT_EL_ID = "collab-extension";

let mountEl = document.getElementById(MOUNT_EL_ID);
if (mountEl) {
    mountEl.innerHTML = "";
}
mountEl = document.createElement("div");
mountEl.setAttribute("id", MOUNT_EL_ID);
document.body.appendChild(mountEl);

const vm = createApp(App).mount(mountEl);

window.collabExtension = vm;
console.log(window.collabExtension);

browser.runtime.onMessage.addListener(message => {
    if (message.toggleVisible) {
        vm.visible = !vm.visible;
    }
});

// Disable console.log
console.log = function (message) {
    // Do nothing
}