<template>
    <div class="col-ex-scroll-to-container">
        <div v-if="users.length === 0" :style="{display: 'flex', 'justify-content': 'space-between'}">
            <span>Invite other users to join you!</span>
            <button class="col-ex-btn" @click="copyToClipboard">
                <icon name="paste"></icon>
                Copy Session ID
            </button>
        </div>
        <template v-for="user in users">
            <div class="col-ex-avatar-container">
                <div>
                    <span @click="scrollTo(user)" class="col-ex-avatar" :style="'background-color: ' + user.color"
                          :title="user.name">{{ getInitialLetter(user.name) }}</span>
                </div>
                <div>
                    <div class="col-ex-avatar-name" :title="user.name">{{ user.name }}</div>
                    <div>
                        <button v-if="onSameUrl(user.url)" class="col-ex-btn" @click="scrollTo(user)"
                                :title="'Scroll to' + user.name">
                            <icon name="location"></icon>
                            <span v-show="showBtnText">
                                Scroll to
                            </span>
                        </button>
                        <button v-if="onSameUrl(user.url)" class="col-ex-btn" @click="toggleFollow(user)"
                                :title="(user.id === userToFollow ? 'Unfollow ' : 'Follow ') + user.name">
                            <icon name="magnet"></icon>
                            <span v-show="showBtnText">
                                {{ user.id === userToFollow ? 'Unfollow ' : 'Follow ' }}
                            </span>
                        </button>
                        <a v-if="!onSameUrl(user.url)" class="col-ex-btn" :href="user.url" target="_blank"
                           :title="'Open ' + user.name + '´s page'">
                            <icon name="link"></icon>
                            <span v-show="showBtnText">
                                Open page
                            </span>
                        </a>
                    </div>
                </div>


            </div>
        </template>
    </div>

</template>

<script>
import {store} from "@/store";
import {copyToClipboard, scrollToUser} from "@/service";
import Icon from "@/components/Icon.vue";

export default {
    name: "UserScrollFollow",
    props: ['users', 'showBtnText'],
    components: {Icon},
    computed: {
        userToFollow() {
            return store.userToFollow;
        },
    },
    methods: {
        copyToClipboard,
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

.col-ex-avatar {
    margin-right: 10px;
    cursor: pointer;
}

.col-ex-avatar-container {
    display: flex;
    align-items: center;
}

.col-ex-avatar-container + .col-ex-avatar-container {
    margin-top: 5px;
}

.col-ex-scroll-to-container {
    padding: 5px;
    border-radius: 5px;
    margin-top: 5px;
    margin-bottom: 5px;
}

</style>