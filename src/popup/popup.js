import { createApp } from 'vue'
import Popup from "@/components/Popup.vue";
import "@/style/main.css";

const MOUNT_EL_ID = "collab-extension-popup";

let mountEl = document.getElementById(MOUNT_EL_ID);
if (mountEl) {
    mountEl.innerHTML = "";
}
mountEl = document.createElement("div");
mountEl.setAttribute("id", MOUNT_EL_ID);
document.body.appendChild(mountEl);

const vm = createApp(Popup).mount(mountEl);