import React from "react";
import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
        <h1 className="text-4xl font-bold mb-8">ログイン</h1>
        <SignIn path="/auth/login" signUpUrl="/auth/register" redirectUrl="/mypage" />
      </main>
    </div>
  );
}
