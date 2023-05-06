<template>
    <editor-content :editor="editor" class="test"/>
</template>

<script>
import StarterKit from '@tiptap/starter-kit'
import {Editor, EditorContent} from '@tiptap/vue-3'
import {getRandId} from "@/firebase";

export default {
    components: {
        EditorContent,
    },

    props: {
        modelValue: {
            type: String,
            default: '',
        },
        editorId: {
            type: String,
            default: '',
        },
        editorClass: {
            type: String,
            default: '',
        },
    },

    emits: ['update:modelValue'],

    data() {
        return {
            editor: null,
        }
    },

    watch: {
        modelValue(value) {
            // HTML
            const isSame = this.editor.getHTML() === value

            // JSON
            // const isSame = JSON.stringify(this.editor.getJSON()) === JSON.stringify(value)

            if (isSame) {
                return
            }

            this.editor.commands.setContent(value, false)
        },
    },

    mounted() {
        this.editor = new Editor({
            editorProps: {
                attributes: {
                    class: this.editorClass,
                    id: this.editorId ?? getRandId(),
                },
            },

            extensions: [
                StarterKit,
            ],
            content: this.modelValue,
            onUpdate: () => {
                // HTML
                this.$emit('update:modelValue', this.editor.getHTML())

                // JSON
                // this.$emit('update:modelValue', this.editor.getJSON())
            },
        })
    },

    beforeUnmount() {
        this.editor.destroy()
    },
}
</script>