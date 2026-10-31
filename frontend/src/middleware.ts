import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/groups(.*)", "/expenses(.*)", "/settlements(.*)", "/analytics(.*)", "/settings(.*)", "/profile(.*)"]);
const isPublicRoute = createRouteMatcher(["/login(.*)", "/register(.*)", "/"]);

export default clerkMiddleware((auth, req) => {
  const { userId } = auth();

  if (isProtectedRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  if (isPublicRoute(req)) {
    if (userId) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
