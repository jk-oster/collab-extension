<template>
    <div class="col-ex-draggable" :style="{ left: left + 'px', top: top + 'px' }" @mousedown="startDrag">
        <slot />
    </div>
</template>

<script>
export default {
    data() {
        return {
            dragging: false,
            rel: null,
            left: 0,
            top: 0,
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
    position: absolute;
    cursor: move;
}
</style>