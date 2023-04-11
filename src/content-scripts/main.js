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

const vueApp = createApp(App);

const vm = vueApp.mount(mountEl);

window.collabExtension = vm;
console.log(window.collabExtension);

// Disable console.log
// console.log = function (message) {
//     // Do nothing
// }