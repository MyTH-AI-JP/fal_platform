import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
        <h1 className="text-6xl font-bold mb-8">Fal AI Platform</h1>
        <p className="text-xl mb-8">
          画像生成 AI を使ったサブスクリプションサービス
        </p>
        <div className="flex flex-row gap-4">
          <Link
            href="/auth/login"
            className="px-6 py-3 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            ログイン
          </Link>
          <Link
            href="/auth/register"
            className="px-6 py-3 rounded-md bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
          >
            会員登録
          </Link>
        </div>
      </main>
    </div>
  );
}
