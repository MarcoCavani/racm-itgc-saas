import { supabase } from './supabase'

export const dbService = {
  // ============ ASSESSMENTS ============

  // Create new assessment
  async createAssessment(userId, assessmentName) {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .insert({
          user_id: userId,
          assessment_name: assessmentName,
          status: 'draft',
          controls_data: {},
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating assessment:', error)
      throw error
    }
  },

  // Get user's assessments
  async getUserAssessments(userId) {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting assessments:', error)
      return []
    }
  },

  // Get assessment by ID
  async getAssessment(assessmentId) {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting assessment:', error)
      return null
    }
  },

  // Update assessment controls data
  async updateAssessmentData(assessmentId, controlsData) {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .update({
          controls_data: controlsData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessmentId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating assessment:', error)
      throw error
    }
  },

  // Complete assessment
  async completeAssessment(assessmentId) {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessmentId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error completing assessment:', error)
      throw error
    }
  },

  // Delete assessment
  async deleteAssessment(assessmentId) {
    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', assessmentId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting assessment:', error)
      throw error
    }
  },

  // ============ TEMPLATES ============

  // Get all templates
  async getTemplates() {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting templates:', error)
      return []
    }
  },

  // Get template by ID
  async getTemplate(templateId) {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting template:', error)
      return null
    }
  },

  // Create template (admin only)
  async createTemplate(templateData) {
    try {
      const { data, error } = await supabase
        .from('templates')
        .insert(templateData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating template:', error)
      throw error
    }
  },

  // Update template (admin only)
  async updateTemplate(templateId, updates) {
    try {
      const { data, error } = await supabase
        .from('templates')
        .update(updates)
        .eq('id', templateId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating template:', error)
      throw error
    }
  },

  // ============ TEMPLATE PURCHASES ============

  // Get user's purchased templates
  async getUserPurchasedTemplates(userId) {
    try {
      const { data, error } = await supabase
        .from('template_purchases')
        .select('*, templates(*)')
        .eq('user_id', userId)
        .order('purchased_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting purchased templates:', error)
      return []
    }
  },

  // Record template purchase
  async recordTemplatePurchase(userId, templateId, stripePaymentId, amount) {
    try {
      const { data, error } = await supabase
        .from('template_purchases')
        .insert({
          user_id: userId,
          template_id: templateId,
          stripe_payment_id: stripePaymentId,
          amount,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error recording purchase:', error)
      throw error
    }
  },

  // Check if user has purchased template
  async hasUserPurchasedTemplate(userId, templateId) {
    try {
      const { data, error } = await supabase
        .from('template_purchases')
        .select('id')
        .eq('user_id', userId)
        .eq('template_id', templateId)
        .single()

      if (error && error.code === 'PGRST116') return false
      if (error) throw error
      return !!data
    } catch (error) {
      console.error('Error checking purchase:', error)
      return false
    }
  },

  // ============ SUBSCRIPTIONS ============

  // Get user subscription
  async getUserSubscription(userId) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code === 'PGRST116') return null
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting subscription:', error)
      return null
    }
  },

  // Create subscription
  async createSubscription(subscriptionData) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating subscription:', error)
      throw error
    }
  },

  // Update subscription
  async updateSubscription(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating subscription:', error)
      throw error
    }
  },

  // ============ PAYMENTS ============

  // Record payment
  async recordPayment(paymentData) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error recording payment:', error)
      throw error
    }
  },

  // Get user payments
  async getUserPayments(userId) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting payments:', error)
      return []
    }
  },

  // ============ USERS ============

  // Get user profile
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting user profile:', error)
      return null
    }
  },

  // Update user profile
  async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  },

  // Increment assessment count
  async incrementAssessmentCount(userId) {
    try {
      const user = await this.getUserProfile(userId)
      const newCount = (user?.assessment_count || 0) + 1

      return await this.updateUserProfile(userId, {
        assessment_count: newCount,
      })
    } catch (error) {
      console.error('Error incrementing assessment count:', error)
      throw error
    }
  },

  // ============ ADMIN ============

  // Get all users (admin only - relies on RLS admin policy)
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting all users:', error)
      return []
    }
  },

  // Get all subscriptions with user info (admin only)
  async getAllSubscriptions() {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, users(email, full_name)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting all subscriptions:', error)
      return []
    }
  },

  // Get all payments with user info (admin only)
  async getAllPayments() {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*, users(email, full_name)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting all payments:', error)
      return []
    }
  },

  // Get revenue summary (admin only)
  async getRevenueStats() {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('amount, type, status')
        .eq('status', 'succeeded')

      if (error) throw error

      const rows = data || []
      const total = rows.reduce((sum, p) => sum + Number(p.amount), 0)
      const subscriptionRevenue = rows
        .filter((p) => p.type === 'subscription')
        .reduce((sum, p) => sum + Number(p.amount), 0)
      const templateRevenue = rows
        .filter((p) => p.type === 'template')
        .reduce((sum, p) => sum + Number(p.amount), 0)

      return { total, subscriptionRevenue, templateRevenue, paymentCount: rows.length }
    } catch (error) {
      console.error('Error getting revenue stats:', error)
      return { total: 0, subscriptionRevenue: 0, templateRevenue: 0, paymentCount: 0 }
    }
  },
}
