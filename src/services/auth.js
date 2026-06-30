import { supabase, getCurrentUser } from './supabase'

export const authService = {
  // Sign up new user
  async signup(email, password, fullName) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })

      if (error) throw error

      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Login user
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return { success: true, user: data.user, session: data.session }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Logout user
  async logout() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return null

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error
      return { ...session.user, profile: data }
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  },

  // Reset password
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Update password
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })
  },
}