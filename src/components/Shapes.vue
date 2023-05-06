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
                 @click="focusShape($event, shape)">
                <span class="col-ex-shape-info">
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
                </span>


                <editor class="col-ex-shape-editor" :editorId="'shape-editor-' +  shape.id" v-model="shape.text"
                        @keydown.exact.alt.enter="saveShapeText(shape.id)" @focusout="saveShapeText(shape.id)"/>
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

    &:focus {
      outline: 3px solid rgb(255, 12, 40);
      opacity: 0.3;
    }

    &-info {
      visibility: hidden;
    }

    &:hover &-info {
      visibility: visible;
    }

    &-editor {

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