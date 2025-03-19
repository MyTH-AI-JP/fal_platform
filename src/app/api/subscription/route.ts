import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../lib/supabase/client';

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

    // Get user from Supabase
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Get user's subscription and API usage
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id, plan, status, current_period_end')
      .eq('user_id', userData.id)
      .single();

    if (!subscription) {
      return NextResponse.json({
        subscription: {
          plan: 'free',
          status: 'active',
          currentPeriodEnd: null
        },
        apiUsage: {
          used: 0,
          limit: 1,
          resetDate: null
        }
      });
    }

    // Get API usage
    const { data: apiUsage } = await supabaseAdmin
      .from('api_usage')
      .select('api_calls_used, api_calls_limit, reset_date')
      .eq('user_id', userData.id)
      .eq('subscription_id', subscription.id)
      .single();

    return NextResponse.json({
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end
      },
      apiUsage: apiUsage ? {
        used: apiUsage.api_calls_used,
        limit: apiUsage.api_calls_limit,
        resetDate: apiUsage.reset_date
      } : {
        used: 0,
        limit: 1,
        resetDate: null
      }
    });
  } catch (error: any) {
    console.error('Error fetching subscription data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
