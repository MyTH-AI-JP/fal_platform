import React from "react";
import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
        <h1 className="text-4xl font-bold mb-8">会員登録</h1>
        <SignUp path="/auth/register" signInUrl="/auth/login" redirectUrl="/mypage" />
      </main>
    </div>
  );
}
