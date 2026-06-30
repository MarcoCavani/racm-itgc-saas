import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const handler = async (event) => {
  const sig = event.headers['stripe-signature']

  let webhookEvent
  try {
    webhookEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  try {
    switch (webhookEvent.type) {
      case 'checkout.session.completed': {
        const session = webhookEvent.data.object
        const { type, userId, templateId } = session.metadata

        if (type === 'subscription') {
          // Get subscription details from Stripe
          const stripeSub = await stripe.subscriptions.retrieve(session.subscription)

          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
            status: 'active',
            current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
          }, { onConflict: 'user_id' })

          await supabase.from('users').update({
            subscription_status: 'active',
            stripe_customer_id: session.customer,
          }).eq('id', userId)

          await supabase.from('payments').insert({
            user_id: userId,
            stripe_payment_id: session.id,
            amount: session.amount_total / 100,
            currency: (session.currency || 'usd').toUpperCase(),
            type: 'subscription',
            status: 'succeeded',
            description: 'Monthly subscription',
          })
        }

        if (type === 'template') {
          await supabase.from('template_purchases').insert({
            user_id: userId,
            template_id: templateId,
            stripe_payment_id: session.payment_intent,
            amount: session.amount_total / 100,
          })

          await supabase.from('payments').insert({
            user_id: userId,
            stripe_payment_id: session.payment_intent,
            amount: session.amount_total / 100,
            currency: (session.currency || 'usd').toUpperCase(),
            type: 'template',
            status: 'succeeded',
            description: 'Template purchase',
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = webhookEvent.data.object
        await supabase.from('subscriptions')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id)

        await supabase.from('users')
          .update({ subscription_status: 'cancelled' })
          .eq('stripe_customer_id', sub.customer)
        break
      }

      case 'customer.subscription.updated': {
        const sub = webhookEvent.data.object
        await supabase.from('subscriptions').update({
          status: sub.status === 'active' ? 'active' : 'cancelled',
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }).eq('stripe_subscription_id', sub.id)
        break
      }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) }
  } catch (error) {
    console.error('Webhook handler error:', error)
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }
}
