import { authMiddleware } from "@clerk/nextjs";

// パブリックルートの設定（認証不要なページ）
export default authMiddleware({
  publicRoutes: [
    "/",
    "/auth/login(.*)",
    "/auth/register(.*)",
    "/api/webhook/stripe"
  ],
  ignoredRoutes: [
    "/((?!api|trpc))/_next/static/(.*)$",
    "/favicon.ico",
    "/_next/image"
  ]
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
