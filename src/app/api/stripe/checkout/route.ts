import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { stripe, PLANS } from '../../../../lib/stripe';
import { supabaseAdmin } from '../../../../lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // Get the current user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the plan from the URL
    const searchParams = request.nextUrl.searchParams;
    const plan = searchParams.get('plan') as keyof typeof PLANS;

    if (!plan || !PLANS[plan]) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // If it's the free plan, update the database directly
    if (plan === 'FREE') {
      // Get or create user in Supabase
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      let userId = userData?.id;

      if (!userId) {
        // Create user if not exists
        const { data: newUser, error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            clerk_id: user.id,
            email: user.emailAddresses[0].emailAddress,
            username: user.username || user.firstName,
            avatar_url: user.imageUrl,
          })
          .select('id')
          .single();

        if (userError) {
          console.error('Error creating user:', userError);
          return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
          );
        }

        userId = newUser.id;
      }

      // Update or create subscription
      const { data: existingSubscription } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingSubscription) {
        await supabaseAdmin
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSubscription.id);
      } else {
        const { data: newSubscription, error: subscriptionError } = await supabaseAdmin
          .from('subscriptions')
          .insert({
            user_id: userId,
            plan: 'free',
            status: 'active',
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
            api_calls_limit: PLANS.FREE.apiCalls,
            reset_date: resetDate.toISOString(),
          });
      }

      return NextResponse.redirect(new URL('/mypage', request.url));
    }

    // For paid plans, create a Stripe checkout session
    // First, check if the user already has a Stripe customer ID
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single();

    let userId = userData?.id;

    if (!userId) {
      // Create user if not exists
      const { data: newUser, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          clerk_id: user.id,
          email: user.emailAddresses[0].emailAddress,
          username: user.username || user.firstName,
          avatar_url: user.imageUrl,
        })
        .select('id')
        .single();

      if (userError) {
        console.error('Error creating user:', userError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }

      userId = newUser.id;
    }

    // Get existing subscription
    const { data: subscriptionData } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    let stripeCustomerId = subscriptionData?.stripe_customer_id;

    // If no Stripe customer ID, create one
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.emailAddresses[0].emailAddress,
        name: user.username || `${user.firstName} ${user.lastName || ''}`.trim(),
        metadata: {
          userId,
          clerkId: user.id,
        },
      });

      stripeCustomerId = customer.id;
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: PLANS[plan].stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.headers.get('origin')}/mypage?success=true`,
      cancel_url: `${request.headers.get('origin')}/mypage?canceled=true`,
      metadata: {
        userId,
        clerkId: user.id,
        plan,
      },
    });

    return NextResponse.redirect(session.url as string);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
