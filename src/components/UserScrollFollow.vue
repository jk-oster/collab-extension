<template>
    <div class="col-ex-scroll-to-container">
        <div v-if="users.length === 0">Invite other users to join you!</div>
        <template v-for="user in users">
            <div class="col-ex-avatar-container">
            <span>
                <span @click="scrollTo(user)" class="col-ex-avatar" :style="'background-color: ' + user.color">{{getInitialLetter(user.name)}}</span>
            </span>

                <button v-if="onSameUrl(user.url)" class="col-ex-btn" @click="scrollTo(user)">
                    <icon name="location"></icon> Scroll to {{ user.name }}
                </button>
                <button v-if="onSameUrl(user.url)" class="col-ex-btn" @click="toggleFollow(user)">
                   <icon name="magnet"></icon> {{ user.id === userToFollow ? 'Unfollow ' : 'Follow ' }}{{ user.name }}
                </button>
                <a v-if="!onSameUrl(user.url)" class="col-ex-btn" :href="user.url" target="_blank">
                   <icon name="link"></icon> Open {{ user.name }}'s page
                </a>
            </div>
        </template>
    </div>

</template>

<script>
import {store} from "@/store";
import {scrollToUser} from "@/service";

export default {
    name: "UserScrollFollow",
    props: ['users'],
    computed: {
        userToFollow() {
            return store.userToFollow;
        },
    },
    methods: {
        // Scroll window to center of the position of defined user
        scrollTo(user) {
            scrollToUser(user);
        },

        getInitialLetter(name) {
            return name.slice(0, 1);
        },

        toggleFollow(user) {
            if (store.userToFollow === user.id) {
                store.userToFollow = '';
            } else {
                store.userToFollow = user.id;
            }
        },

        onSameUrl(url) {
            return url === window.location.href;
        },
    }
}
</script>

<style scoped>

.col-ex-avatar-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.col-ex-scroll-to-container {
    border: 1px solid #ccc;
    padding: 5px;
    border-radius: 5px;
    margin-top: 5px;
    margin-bottom: 5px;
}

</style>