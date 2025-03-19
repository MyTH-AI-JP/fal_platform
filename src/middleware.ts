import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/auth/login(.*)",
  "/auth/register(.*)",
  "/api/webhook/stripe"
]);

export default clerkMiddleware(async (auth, req) => {
  // ログイン不要なルートかチェック
  if (!isPublicRoute(req)) {
    // 認証を要求
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Next.js内部のファイルと静的ファイルはスキップ
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
