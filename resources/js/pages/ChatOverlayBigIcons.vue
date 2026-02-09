<script setup>
import ChatOverlay from '@/components/ChatOverlay.vue';
</script>

<template>
    <div class="overlay-root">
        <ChatOverlay layoutMode="big-icons" />
    </div>
</template>

<style scoped>
.overlay-root {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: transparent;
}
</style>
