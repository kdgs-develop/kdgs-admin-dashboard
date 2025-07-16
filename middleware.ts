import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/public/obituary(.*)",
  "/api/generate-pdf(.*)",
  "/api/download-image(.*)",
  "/api/webhooks/stripe(.*)",
  "/public/search(.*)",
  "/api/download-all-files(.*)",
  "/robots.txt",
  "/sitemap.xml"
]);

export default clerkMiddleware((auth, req) => {
  // Allow indexing for public search routes
  if (req.nextUrl.pathname.startsWith("/public/search")) {
    const response = NextResponse.next();
    // Remove any noindex headers and explicitly allow indexing
    response.headers.delete("X-Robots-Tag");
    response.headers.set("X-Robots-Tag", "index, follow");
    return response;
  }

  if (!isPublicRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)"
  ]
};
