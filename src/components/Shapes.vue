<template>
    <div class="col-ex-draw-container">
        <button class="col-ex-btn" @click="toggleDrawing">
            <icon name="pencil"></icon>
            Draw Shape
        </button>
        <label for="showShapes">
            Show shapes
            <input id="showShapes" type="checkbox" @click="toggleShapes" :value="store.showShapes"/>
        </label>
    </div>

    <template v-for="shape in shapes">
        <teleport to="body">
            <div :style="shapeStyle(shape)" :id="shape.id" tabindex="0" class="col-ex-shape"
                 @click="focusShape($event, shape)">

            </div>
        </teleport>
    </template>

</template>

<script>
import {saveToExtStorageAnd, store} from "@/store";
import {addShapeToSession, getRandId} from "@/firebase";
import {sendToRuntime} from "@/service";

export default {
    name: "Shapes",

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
                left: event.pageX,
                top: event.pageY,
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

            this.lastShape.width = event.pageX - this.lastShape.left;
            this.lastShape.height = event.pageY - this.lastShape.top;

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
            return `left: ${shape.left}px; top: ${shape.top}px; width: ${shape.width}px; height: ${shape.height}px; background-color: ${shape.color};border: 1px solid ${shape.color};`;
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
    z-index: 9999;

    &:focus {
      outline: 3px solid rgba(12, 89, 255);
      opacity: 0.2;
    }
  }
}
</style>