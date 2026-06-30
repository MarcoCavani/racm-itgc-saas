<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-white mb-4">404</h1>
      <p class="text-xl text-blue-100 mb-8">Page not found</p>
      <router-link 
        to="/dashboard" 
        class="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 font-semibold"
      >
        Back to Dashboard
      </router-link>
    </div>
  </div>
</template>

<script setup>
</script>
