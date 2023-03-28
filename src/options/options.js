var browser = require("webextension-polyfill");

import { createApp } from 'vue'
import Options from "@/components/Options.vue";

const MOUNT_EL_ID = "collab-extension-options";

let mountEl = document.getElementById(MOUNT_EL_ID);
if (mountEl) {
    mountEl.innerHTML = "";
}
mountEl = document.createElement("div");
mountEl.setAttribute("id", MOUNT_EL_ID);
document.body.appendChild(mountEl);

const vm = createApp(Options).mount(mountEl);

window.collabExtension = vm;
console.log(window.collabExtension);

browser.runtime.onMessage.addListener(message => {
    if (message.toggleVisible) {
        vm.visible = !vm.visible;
    }
});