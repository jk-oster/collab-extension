<template>
    <div class="col-ex-draggable" :style="{ left: left + 'px', top: top + 'px', position: type }" @mousedown="startDrag">
        <slot />
    </div>
    <div v-if="dragging && dragShield" class="col-ex-drag-shield" @mousedown.prevent="()=>{}" />
</template>

<script>
export default {
    props: ['initialLeft', 'initialTop', 'dragShield', 'type'],
    data() {
        return {
            dragging: false,
            rel: null,
            left: this.initialLeft ?? window.innerWidth - 200,
            top: this.initialTop ?? 100,
            dragShield: this.dragShield ?? false,
            type: this.type ?? 'fixed',
        };
    },
    methods: {
        startDrag(e) {
            e.preventDefault();
            this.rel = { x: e.clientX - this.left, y: e.clientY - this.top };
            this.dragging = true;
            window.addEventListener('mousemove', this.move);
            window.addEventListener('mouseup', this.stopDrag);
        },
        move(e) {
            e.preventDefault();
            if (this.dragging) {
                this.left = e.clientX - this.rel.x;
                this.top = e.clientY - this.rel.y;
            }
        },
        stopDrag() {
            this.dragging = false;
            this.rel = null;
            window.removeEventListener('mousemove', this.move);
            window.removeEventListener('mouseup', this.stopDrag);
        },
    },
};
</script>

<style>
.col-ex-draggable {
    cursor: move;
    z-index: 9999;
}

.col-ex-drag-shield {
    bottom: 0px ;
    left: 0px ;
    position: fixed;
    right: 0px ;
    top: 0px ;
    z-index: 9990;
}
</style>