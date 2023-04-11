<template>
    <div class="col-ex-draw-container">
        <button class="col-ex-btn" @click="toggleDrawing">
            <icon name="pencil"></icon>
            Draw Shape
        </button>
        <button id="showShapes" class="col-ex-btn" @click="toggleShapes">
            <icon name="eye"></icon>
            Toggle shapes
        </button>
    </div>

    <template v-for="shape in shapes">

        <teleport to="body">
            <div :style="shapeStyle(shape)" :id="shape.id" tabindex="0" class="col-ex-shape"
                 @click="focusShape($event, shape)">
                        <span class="col-ex-badge-element" :style="{'background-color': shape.color}">{{
                            shape.user
                            }}</span>
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

        shapeStyle(shape) {
            return {
                width: (shape.width * window.innerWidth).toFixed(0) + 'px',
                height: (shape.height * getWindowTotalHeight()).toFixed(0) +'px',
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
    opacity: 0.5;
    border-radius: 5px;
    z-index: 9990;

    &:focus {
      outline: 3px solid rgb(255, 12, 40);
      opacity: 0.3;
    }
  }
}

.col-ex-drag-shield {
  bottom: 0px;
  left: 0px;
  position: fixed;
  right: 0px;
  top: 0px;
  z-index: 9990;
}
</style>