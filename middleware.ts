import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  publicRoutes: ['/', '/api/webhook/clerk', '/api/uploadthing'],
  ignoredRoutes: ['/api/webhook/clerk']
});

// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// const isPublicRoute = createRouteMatcher(['/(.*)', '/api/webhook/clerk(.*)', '/api/uploadthing(.*)']);
// const isIgnoredRoute = createRouteMatcher(['/api/webhook/clerk(.*)']);

// export default clerkMiddleware((auth, request) => {
//   if(!isPublicRoute(request) && !isIgnoredRoute(request)) {
//     auth().protect();
//   }
// });
export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
