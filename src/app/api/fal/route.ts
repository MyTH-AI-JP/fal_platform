import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../lib/supabase/client';
import { fal } from '@fal-ai/client';

// Initialize Fal AI client
if (process.env.FAL_AI_API_KEY) {
  fal.config({
    credentials: process.env.FAL_AI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the request body
    const { prompt } = await request.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid prompt' },
        { status: 400 }
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
      .select('id, plan, status')
      .eq('user_id', userData.id)
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 403 }
      );
    }

    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Subscription is not active' },
        { status: 403 }
      );
    }

    // Get API usage
    const { data: apiUsage } = await supabaseAdmin
      .from('api_usage')
      .select('id, api_calls_used, api_calls_limit, reset_date')
      .eq('user_id', userData.id)
      .eq('subscription_id', subscription.id)
      .single();

    if (!apiUsage) {
      return NextResponse.json(
        { error: 'API usage record not found' },
        { status: 404 }
      );
    }

    // Check if user has reached their API call limit
    if (apiUsage.api_calls_used >= apiUsage.api_calls_limit) {
      return NextResponse.json(
        { 
          error: 'API call limit reached', 
          usage: {
            used: apiUsage.api_calls_used,
            limit: apiUsage.api_calls_limit,
            resetDate: apiUsage.reset_date
          }
        },
        { status: 403 }
      );
    }

    // Call Fal AI API
    const result = await fal.subscribe('fal-ai/stable-diffusion-v35-large', {
      input: {
        prompt: prompt
      },
      logs: true,
    });

    // Increment API usage
    await supabaseAdmin
      .from('api_usage')
      .update({
        api_calls_used: apiUsage.api_calls_used + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', apiUsage.id);

    // Return the result
    return NextResponse.json({
      success: true,
      imageUrl: result.data.images[0], // Image URL from the API response
      requestId: result.requestId,
      usage: {
        used: apiUsage.api_calls_used + 1,
        limit: apiUsage.api_calls_limit,
        resetDate: apiUsage.reset_date
      }
    });
  } catch (error: any) {
    console.error('Error generating video:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
