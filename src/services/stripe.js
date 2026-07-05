import { loadStripe } from '@stripe/stripe-js'
import { supabase } from './supabase'

let stripePromise = null

const getStripe = async () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  }
  return stripePromise
}

export const stripeService = {
  // Create checkout session for subscription
  async createSubscriptionCheckout(userId) {
    try {
      const origin = window.location.origin
      const response = await fetch('/api/create-subscription-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          priceId: import.meta.env.VITE_STRIPE_SUBSCRIPTION_PRICE_ID,
          successUrl: `${origin}/dashboard?subscription=success`,
          cancelUrl: `${origin}/upgrade?subscription=cancelled`,
        }),
      })

      if (!response.ok) throw new Error('Failed to create checkout session')

      const { sessionId } = await response.json()
      const stripe = await getStripe()
      const { error } = await stripe.redirectToCheckout({ sessionId })

      if (error) throw error
    } catch (error) {
      console.error('Subscription checkout error:', error)
      throw error
    }
  },

  // Create checkout session for template purchase
  async createTemplateCheckout(userId, templateId) {
    try {
      const origin = window.location.origin
      const response = await fetch('/api/create-template-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          templateId,
          priceId: import.meta.env.VITE_STRIPE_TEMPLATE_PRICE_ID,
          successUrl: `${origin}/templates?download=success`,
          cancelUrl: `${origin}/templates?download=cancelled`,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to create checkout session')
      }

      const { sessionId } = await response.json()
      const stripe = await getStripe()
      const { error } = await stripe.redirectToCheckout({ sessionId })

      if (error) throw error
    } catch (error) {
      console.error('Template checkout error:', error)
      throw error
    }
  },

  // Open customer portal
  async openCustomerPortal(customerId) {
    try {
      const response = await fetch('/api/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          returnUrl: `${window.location.origin}/settings`,
        }),
      })

      if (!response.ok) throw new Error('Failed to open customer portal')

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Customer portal error:', error)
      throw error
    }
  },

  // Get subscription status
  async getSubscriptionStatus(userId) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting subscription:', error)
      return null
    }
  },

  // Check if user is subscribed
  async isSubscribed(userId) {
    const subscription = await this.getSubscriptionStatus(userId)
    return subscription && subscription.status === 'active'
  },

  // Get user's payment methods
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
}
