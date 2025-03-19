import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">ログイン</h1>
        <SignIn 
          path="/auth/login" 
          routing="path" 
          signUpUrl="/auth/register" 
          redirectUrl="/mypage"
          appearance={{
            elements: {
              formButtonPrimary: "bg-blue-500 hover:bg-blue-600 text-white",
              card: "rounded-md shadow-md"
            }
          }}
        />
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>※ GitHubログインを利用するには、Clerkダッシュボードでソーシャル接続を有効にしてください。</p>
        </div>
      </div>
    </div>
  );
} 