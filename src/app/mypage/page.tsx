import React from "react";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import ImageGenerator from "./ImageGenerator";

export default async function MyPage() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center py-2">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">認証が必要です</h1>
            <p className="mb-4 text-gray-700">ログインしてください</p>
            <Link href="/auth/login" className="text-blue-500 underline">
              ログインページへ
            </Link>
          </div>
        </div>
      );
    }
    
    // 開発環境用のデモデータ
    const subscriptionData = {
      plan: 'free' as const,
      status: 'active',
      apiCallsRemaining: 5
    };
    
    // プラン表示名マッピング
    const planDisplayNames: {[key: string]: string} = {
      'free': '無料プラン',
      'basic': 'ベーシックプラン ($20/月)',
      'premium': 'プレミアムプラン ($100/月)'
    };
    
    return (
      <div className="flex min-h-screen flex-col items-center py-12 px-4 bg-gray-50">
        <div className="w-full max-w-4xl">
          <div className="flex justify-between items-center mb-12">
            <h1 className="text-3xl font-bold text-gray-800">マイページ</h1>
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
                <h2 className="text-2xl font-semibold text-gray-800">
                  こんにちは、{user?.firstName || user?.username || "ゲスト"}さん
                </h2>
                <p className="text-gray-600">{user?.emailAddresses[0]?.emailAddress || ""}</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-2 text-gray-800">サブスクリプションプラン</h3>
              <p className="text-gray-700 mb-4">
                現在のプラン: <span className="font-semibold text-gray-900">{planDisplayNames[subscriptionData.plan] || '無料プラン'}</span>
              </p>
              <p className="text-gray-700 mb-4">
                残りの API コール数: <span className="font-semibold text-gray-900">{subscriptionData.apiCallsRemaining}</span>
              </p>
              
              <div className="flex flex-wrap gap-4 mt-6">
                <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
                  無料プラン
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  ベーシックプラン ($20/月)
                </button>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                  プレミアムプラン ($100/月)
                </button>
              </div>
            </div>
          </div>
          
          <ImageGenerator apiCallsRemaining={subscriptionData.apiCallsRemaining} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("マイページエラー:", error);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-2">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">エラーが発生しました</h1>
          <p className="mb-4 text-gray-700">ログインしてアクセスしてください</p>
          <Link href="/auth/login" className="text-blue-500 underline">
            ログインページへ
          </Link>
        </div>
      </div>
    );
  }
}
