<template>
    <div>Shapes coming soon</div>
</template>

<script>
import {store} from "@/store";

export default {
    name: "Shapes",

    computed: {
        shapes() {
            return store.shapes;
        },
    },
}
</script>

<style scoped>

</style>