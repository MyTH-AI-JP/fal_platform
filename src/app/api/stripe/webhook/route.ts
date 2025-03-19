import { NextRequest, NextResponse } from 'next/server';
import { stripe, PLANS } from '../../../../lib/stripe';
import { supabaseAdmin } from '../../../../lib/supabase/client';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Stripe webhook secret is not set' },
      { status: 500 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed` },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      const { userId, plan } = session.metadata;

      // Get or create subscription
      const { data: existingSubscription } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingSubscription) {
        // Update existing subscription
        await supabaseAdmin
          .from('subscriptions')
          .update({
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            plan: plan.toLowerCase(),
            status: 'active',
            current_period_start: new Date(session.period_start * 1000).toISOString(),
            current_period_end: new Date(session.period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSubscription.id);

        // Update API usage
        const resetDate = new Date();
        resetDate.setMonth(resetDate.getMonth() + 1);

        await supabaseAdmin
          .from('api_usage')
          .update({
            api_calls_used: 0,
            api_calls_limit: PLANS[plan.toUpperCase() as keyof typeof PLANS].apiCalls,
            reset_date: resetDate.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('subscription_id', existingSubscription.id);
      } else {
        // Create new subscription
        const { data: newSubscription, error: subscriptionError } = await supabaseAdmin
          .from('subscriptions')
          .insert({
            user_id: userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            plan: plan.toLowerCase(),
            status: 'active',
            current_period_start: session.period_start ? new Date(session.period_start * 1000).toISOString() : null,
            current_period_end: session.period_end ? new Date(session.period_end * 1000).toISOString() : null,
          })
          .select('id')
          .single();

        if (subscriptionError) {
          console.error('Error creating subscription:', subscriptionError);
          return NextResponse.json(
            { error: 'Failed to create subscription' },
            { status: 500 }
          );
        }

        // Create API usage record
        const resetDate = new Date();
        resetDate.setMonth(resetDate.getMonth() + 1);

        await supabaseAdmin
          .from('api_usage')
          .insert({
            user_id: userId,
            subscription_id: newSubscription.id,
            api_calls_used: 0,
            api_calls_limit: PLANS[plan.toUpperCase() as keyof typeof PLANS].apiCalls,
            reset_date: resetDate.toISOString(),
          });
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription;

      if (subscriptionId) {
        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const { userId } = subscription.metadata;

        if (userId) {
          // Update subscription in Supabase
          const { data: supabaseSubscription } = await supabaseAdmin
            .from('subscriptions')
            .select('id')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

          if (supabaseSubscription) {
            await supabaseAdmin
              .from('subscriptions')
              .update({
                status: subscription.status,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', supabaseSubscription.id);

            // Reset API usage for the new billing period
            const resetDate = new Date(subscription.current_period_end * 1000);

            await supabaseAdmin
              .from('api_usage')
              .update({
                api_calls_used: 0,
                reset_date: resetDate.toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('subscription_id', supabaseSubscription.id);
          }
        }
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as any;
      
      // Update subscription in Supabase
      const { data: supabaseSubscription } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (supabaseSubscription) {
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', supabaseSubscription.id);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as any;
      
      // Update subscription in Supabase
      const { data: supabaseSubscription } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (supabaseSubscription) {
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', supabaseSubscription.id);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

// Disable body parsing, we need the raw body for Stripe signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};
