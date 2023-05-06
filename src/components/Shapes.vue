<template>
    <div class="col-ex-draw-container">
        <button class="col-ex-btn" @click="toggleDrawing">
            <icon name="pencil"></icon>
            Draw Shape
        </button>
        <button id="showShapes" class="col-ex-btn" @click="toggleShapes">
            <icon name="eye"></icon>
            Toggle shapes {{ store.showShapes ? 'off' : 'on' }}
        </button>
    </div>

    <template v-for="shape in shapes">
        <teleport to="body">
            <div :style="shapeStyle(shape)" :id="shape.id" tabindex="0" class="col-ex-shape"
                 @mousedown="dragMouseDown"
                 @mousemove="elementDrag"
                 @mouseup="closeDragElement"
                 @click="focusShape($event, shape)">
                <div class="col-ex-shape-info">
                    <span class="col-ex-shape-editor-label" :style="{'background-color': shape.color}">
                        {{ shape.user }}
                    </span>
                    <span>
                        <label class="col-ex-shape-editor-label" :for="'shape-editor-' +  shape.id"
                               @click="focusEditor($event, 'shape-editor-' +  shape.id)">
                            <icon name="pencil" color="white" size="10px"/><span>Edit text</span>
                        </label>
                    </span>
                    <span>
                        <button class="col-ex-shape-editor-label" @click="deleteShape(shape)">
                            <icon name="bin" color="white" size="10px"/><span>Delete shape</span>
                        </button>
                    </span>
                </div>


                <editor class="col-ex-shape-editor" :editorId="'shape-editor-' +  shape.id" v-model="shape.text"
                        @keydown.exact.alt.enter="saveShapeText(shape.id)" @focusout="saveShapeText(shape.id)"/>
                <div class="resizer resizer-right" @mousedown="initResize($event, 'right')"></div>
                <div class="resizer resizer-bottom" @mousedown="initResize($event, 'bottom')"></div>
                <div class="resizer resizer-both" @mousedown="initResize($event, 'both')"></div>
            </div>
        </teleport>
    </template>
    <div v-if="isDrawing" class="col-ex-drag-shield" @mousedown.prevent="()=>{}"/>

</template>

<script>
import {saveToExtStorageAnd, store} from "@/store";
import {getRandId} from "@/firebase";
import {getWindowTotalHeight, sendToRuntime} from "@/service";
import Editor from "@/components/Editor.vue";

export default {
    name: "Shapes",
    components: {Editor},

    data() {
        return {
            isDrawing: false,
            lastShape: null,
            store,
            dragging: false,
            resizing: false,
            resizeDirection: null,
            elem: null,
            startX: 0,
            startY: 0,
            startLeft: 0,
            startTop: 0,
            startWidth: 0,
            startHeight: 0,
        };
    },

    mounted() {
        const element = document.querySelector('body');
        element.addEventListener('mousedown', (e) => {
            if (!this.isDrawing) return;
            e.preventDefault();
            e.stopPropagation();
            this.addShape(e);
        });
        element.addEventListener('mousemove', (e) => {
            if (!this.isDrawing) return;
            e.preventDefault();
            e.stopPropagation();
            this.updateShape(e);
        });
        element.addEventListener('mouseup', (e) => {
            if (!this.isDrawing) return;
            this.updateShape(e);
            this.toggleDrawing();
            this.lastShape = null;
        });
    },

    computed: {
        shapes() {
            return store.showShapes ? store.shapes.filter(shape => shape.id && shape.url === window.location.href) : [];
        },
    },

    methods: {
        addShape(event) {
            const newShape = {
                left: event.pageX / window.innerWidth,
                top: event.pageY / getWindowTotalHeight(),
                width: 0,
                height: 0,
                id: getRandId(),
                user: store.name ?? '',
                date: new Date().getTime() ?? 0,
                url: window.location.href,
                color: store.color,
            };

            store.shapes = [...store.shapes, newShape];

            sendToRuntime({
                action: 'add-shape',
                data: {shape: newShape, shapeId: newShape.id, sessionId: store.sessionId}
            });

            this.lastShape = newShape;
        },

        updateShape(event) {
            if (!this.lastShape) return;

            this.lastShape.width = event.pageX / window.innerWidth - this.lastShape.left;
            this.lastShape.height = event.pageY / getWindowTotalHeight() - this.lastShape.top;

            sendToRuntime({
                action: 'add-shape',
                data: {shape: this.lastShape, shapeId: this.lastShape.id, sessionId: store.sessionId}
            });
        },

        focusShape(event, shape) {
            const elem = event.target;
            elem.focus();
            elem.addEventListener('keydown', (e) => {
                if (e.key === 'Delete' && document.activeElement.id === shape.id) {
                    this.deleteShape(shape);
                }
            });
        },

        focusEditor(event, editorId) {
            event.stopPropagation();
            const editor = document.getElementById(editorId);
            editor.focus();
        },

        shapeStyle(shape) {
            return {
                width: (shape.width * window.innerWidth).toFixed(0) + 'px',
                height: (shape.height * getWindowTotalHeight()).toFixed(0) + 'px',
                'background-color': shape.color,
                left: (shape.left * window.innerWidth).toFixed(0) + 'px',
                top: (shape.top * getWindowTotalHeight()).toFixed(0) + 'px',
                position: 'absolute',
            };
        },

        // Dragging
        dragMouseDown(event) {
            if (!this.isDrawing) {
                this.dragging = true;
                this.elem = event.target;
                this.startX = event.clientX;
                this.startY = event.clientY;
                this.startLeft = parseFloat(this.elem.style.left);
                this.startTop = parseFloat(this.elem.style.top);
            }
        },

        elementDrag(event) {
            if (!this.dragging) return;
            const deltaX = event.clientX - this.startX;
            const deltaY = event.clientY - this.startY;

            this.elem.style.left = this.startLeft + deltaX + "px";
            this.elem.style.top = this.startTop + deltaY + "px";
        },

        closeDragElement() {
            this.setShapeFromElem(this.elem);
            this.dragging = false;
        },
        // Resizing
        initResize(event, direction) {
            event.stopPropagation();
            this.resizing = true;
            this.resizeDirection = direction;
            this.elem = event.target.parentElement;
            this.startX = event.clientX;
            this.startY = event.clientY;
            this.startWidth = parseFloat(this.elem.style.width);
            this.startHeight = parseFloat(this.elem.style.height);
            document.addEventListener("mousemove", this.doResize);
            document.addEventListener("mouseup", this.stopResize);
        },

        doResize(event) {
            if (!this.resizing) return;
            const deltaX = event.clientX - this.startX;
            const deltaY = event.clientY - this.startY;

            if (this.resizeDirection === "right" || this.resizeDirection === "both") {
                this.elem.style.width = this.startWidth + deltaX + "px";
            }
            if (this.resizeDirection === "bottom" || this.resizeDirection === "both") {
                this.elem.style.height = this.startHeight + deltaY + "px";
            }
        },

        getShapeFromId(shapeId) {
            return store.shapes.find(s => s.id === shapeId);
        },

        setShapeFromElem(elem) {
            const shapeId = elem.id;
            const shape = this.getShapeFromId(shapeId);
            if (!shape) return;
            shape.left = parseFloat(elem.style.left) / window.innerWidth;
            shape.top = parseFloat(elem.style.top) / getWindowTotalHeight();
            shape.width = parseFloat(elem.style.width) / window.innerWidth;
            shape.height = parseFloat(elem.style.height) / getWindowTotalHeight();

            sendToRuntime({
                action: 'add-shape',
                data: {shape: shape, shapeId: shape.id, sessionId: store.sessionId}
            });
        },

        stopResize(event) {
            this.resizing = false;
            this.setShapeFromElem(event.target.parentElement);
            document.documentElement.removeEventListener("mousemove", this.doResize);
            document.documentElement.removeEventListener("mouseup", this.stopResize);
        },

        toggleDrawing() {
            this.isDrawing = !this.isDrawing;
        },

        toggleShapes() {
            saveToExtStorageAnd(store, 'showShapes', !store.showShapes);
        },

        deleteShape(shape) {
            if (!shape.id || !store.shapes.find(s => s.id === shape.id)) return;
            saveToExtStorageAnd(store, 'shapes', store.shapes.filter(s => s.id !== shape.id));

            sendToRuntime({
                action: 'delete-shape',
                data: {shapeId: shape.id, sessionId: store.sessionId}
            });
        },

        saveShapeText(shapeId) {
            const currentShape = store.shapes.find(shape => shape.id === shapeId);
            if (!currentShape) return;

            console.log('save shape text', currentShape.text);
            console.log('save shape text', currentShape);
            console.log('save shape text', store.shapes);

            sendToRuntime({
                action: 'add-shape',
                data: {shape: currentShape, shapeId: shapeId, sessionId: store.sessionId}
            });
        },
    },
}
</script>

<style lang="scss">
.col-ex {
  &-draw-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    margin-top: 10px;
  }

  &-shape {

    cursor: move;
    position: absolute;
    opacity: 0.80;
    border-radius: 5px;
    z-index: 9990;
    overflow-y: scroll;
    -ms-overflow-style: none; /* Internet Explorer 10+ */
    scrollbar-width: none; /* Firefox */
    &::-webkit-scrollbar {
      display: none; /* Safari and Chrome */
    }

    .resizer {
      position: absolute;
      width: 10px;
      height: 10px;
      background-color: #333;
      border: 2px solid white;
      border-radius: 100%;
      opacity: 0.85;
      cursor: pointer;
      z-index: 10000;
      visibility: hidden;
    }

    .resizer-right {
      top: calc(50% - 5px);
      right: -5px;
      cursor: e-resize;
    }

    .resizer-bottom {
      bottom: -5px;
      left: calc(50% - 5px);
      cursor: s-resize;
    }

    .resizer-both {
      right: -5px;
      bottom: -5px;
      cursor: se-resize;
    }

    &:focus {
      outline: 3px solid rgb(255, 12, 40);
      //opacity: 0.3;
    }

    &-info {
      visibility: hidden;
    }

    &:hover &-info, &:hover .resizer {
      visibility: visible;
    }

    &-editor {
      cursor: text;

      &-label {
        font-size: 8px;
        color: #fff;
        display: inline-flex;
        align-items: center;
        margin-left: 5px;
        padding: 3px 6px;
        background-color: transparent;
        border: none;

        span {
          margin: 0 5px;
          padding: 0;
        }
      }

      & > .ProseMirror {
        background-color: transparent !important;
        margin: 0 1em !important;
        color: #fff !important;
        padding: 0 5px !important;
        font-weight: normal;

        h1, h2, h3, h4, h5, h6, li, ul, ol {
          color: #fff !important;
        }

        &:hover {
          outline: 2px solid #fff;
        }

        p {
          margin-top: 0.25em;
          margin-bottom: 0.25em;
        }

        > * + * {
          margin-top: 0.25em;
          margin-bottom: 0.25em;
        }
      }
    }
  }

  &-drag-shield {
    bottom: 0px;
    left: 0px;
    position: fixed;
    right: 0px;
    top: 0px;
    z-index: 9990;
  }
}

</style>