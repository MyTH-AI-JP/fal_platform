import React from "react";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import ImageGenerator from "./ImageGenerator";
import { supabaseAdmin } from "../../lib/supabase/client";

export default async function MyPage() {
  const user = await currentUser();
  
  if (!user) {
    return <div>Loading...</div>;
  }
  
  // Get user subscription data from Supabase
  let subscriptionData = {
    plan: 'free',
    status: 'active',
    apiCallsRemaining: 1
  };
  
  // Get user from Supabase
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', user.id)
    .single();
  
  if (userData) {
    // Get subscription data
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id, plan, status')
      .eq('user_id', userData.id)
      .single();
    
    if (subscription) {
      // Get API usage
      const { data: apiUsage } = await supabaseAdmin
        .from('api_usage')
        .select('api_calls_used, api_calls_limit')
        .eq('user_id', userData.id)
        .eq('subscription_id', subscription.id)
        .single();
      
      if (apiUsage) {
        subscriptionData = {
          plan: subscription.plan,
          status: subscription.status,
          apiCallsRemaining: Math.max(0, apiUsage.api_calls_limit - apiUsage.api_calls_used)
        };
      }
    }
  }
  
  // Map plan to display name
  const planDisplayNames: {[key: string]: string} = {
    'free': '無料プラン',
    'basic': 'ベーシックプラン ($20/月)',
    'premium': 'プレミアムプラン ($100/月)'
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center py-12 px-4">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold">マイページ</h1>
          <UserButton afterSignOutUrl="/" />
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
              {user?.imageUrl && (
                <img src={user.imageUrl} alt="User avatar" className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold">
                こんにちは、{user?.firstName || user?.username || "ゲスト"}さん
              </h2>
              <p className="text-gray-600">{user?.emailAddresses[0]?.emailAddress || ""}</p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-2">サブスクリプションプラン</h3>
            <p className="text-gray-700 mb-4">
              現在のプラン: <span className="font-semibold">{planDisplayNames[subscriptionData.plan] || '無料プラン'}</span>
            </p>
            <p className="text-gray-700 mb-4">
              残りの API コール数: <span className="font-semibold">{subscriptionData.apiCallsRemaining}</span>
            </p>
            
            <div className="flex flex-wrap gap-4 mt-6">
              <Link 
                href="/api/stripe/checkout?plan=FREE" 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                無料プラン
              </Link>
              <Link 
                href="/api/stripe/checkout?plan=BASIC" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                ベーシックプラン ($20/月)
              </Link>
              <Link 
                href="/api/stripe/checkout?plan=PREMIUM" 
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                プレミアムプラン ($100/月)
              </Link>
            </div>
          </div>
        </div>
        
        <ImageGenerator apiCallsRemaining={subscriptionData.apiCallsRemaining} />
      </div>
    </div>
  );
}
