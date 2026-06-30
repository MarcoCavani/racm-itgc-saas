import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '../services/auth'
import { dbService } from '../services/database'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.profile?.is_admin)
  const subscription = ref(null)

  // Initialize auth
  const initAuth = async () => {
    loading.value = true
    try {
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        user.value = currentUser
        subscription.value = await dbService.getUserSubscription(currentUser.id)
      }
    } catch (err) {
      console.error('Auth init error:', err)
    } finally {
      loading.value = false
    }
  }

  // Login
  const login = async (email, password) => {
    loading.value = true
    error.value = null
    try {
      const result = await authService.login(email, password)
      if (result.success) {
        user.value = result.user
        subscription.value = await dbService.getUserSubscription(result.user.id)
        return result
      } else {
        error.value = result.error
        return result
      }
    } finally {
      loading.value = false
    }
  }

  // Signup
  const signup = async (email, password, fullName) => {
    loading.value = true
    error.value = null
    try {
      const result = await authService.signup(email, password, fullName)
      if (result.success) {
        user.value = result.user
        return result
      } else {
        error.value = result.error
        return result
      }
    } finally {
      loading.value = false
    }
  }

  // Logout
  const logout = async () => {
    loading.value = true
    try {
      await authService.logout()
      user.value = null
      subscription.value = null
    } finally {
      loading.value = false
    }
  }

  // Update subscription status
  const refreshSubscription = async () => {
    if (user.value) {
      subscription.value = await dbService.getUserSubscription(user.value.id)
    }
  }

  // Check if can create assessment
  const canCreateAssessment = computed(() => {
    if (!user.value) return false
    if (user.value.profile?.assessment_count === 0) return true // First assessment free
    return subscription.value?.status === 'active' // Need subscription for more
  })

  // Listen to auth changes
  const setupAuthListener = () => {
    return authService.onAuthStateChanged(async (event, session) => {
      if (session?.user) {
        user.value = session.user
        const profile = await dbService.getUserProfile(session.user.id)
        if (user.value) {
          user.value.profile = profile
        }
      } else {
        user.value = null
      }
    })
  }

  return {
    user,
    loading,
    error,
    subscription,
    isAuthenticated,
    isAdmin,
    canCreateAssessment,
    initAuth,
    login,
    signup,
    logout,
    refreshSubscription,
    setupAuthListener,
  }
})
