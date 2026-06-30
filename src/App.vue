<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav v-if="authStore.isAuthenticated" class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="font-bold text-xl text-blue-600">
              RACM ITGC
            </router-link>
          </div>
          <div class="flex items-center space-x-4">
            <router-link
              to="/dashboard"
              class="text-gray-700 hover:text-blue-600"
            >
              Dashboard
            </router-link>
            <router-link
              to="/templates"
              class="text-gray-700 hover:text-blue-600"
            >
              Templates
            </router-link>
            <a
              href="https://racm-itgc.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              class="text-gray-700 hover:text-blue-600"
            >
              RACM Tool ↗
            </a>
            <router-link
              v-if="!authStore.subscription || authStore.subscription.status !== 'active'"
              to="/upgrade"
              class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Upgrade
            </router-link>
            <router-link
              v-if="authStore.isAdmin"
              to="/admin"
              class="text-gray-700 hover:text-blue-600"
            >
              Admin
            </router-link>
            <router-link
              to="/settings"
              class="text-gray-700 hover:text-blue-600"
            >
              Settings
            </router-link>
            <button
              @click="handleLogout"
              class="text-gray-700 hover:text-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main>
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="bg-white mt-12 border-t">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p class="text-center text-gray-600">
          &copy; 2024 RACM ITGC. All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const router = useRouter()

// Initialize auth on mount
authStore.initAuth()

// Listen to auth changes
authStore.setupAuthListener()

// Handle logout
const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<style>
* {
  @apply transition-colors;
}
</style>
