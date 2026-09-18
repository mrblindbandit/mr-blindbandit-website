import {clerkMiddleware,createRouteMatcher} from '@clerk/nextjs/server';
const protectedRoute=createRouteMatcher(['/portal(.*)','/owner(.*)']);
export default clerkMiddleware(async(auth,request)=>{if(protectedRoute(request))await auth.protect();});
export const config={matcher:['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|webp|ico|woff2?|ttf|map|txt|xml|pdf)).*)','/(api|trpc)(.*)','/__clerk/:path*']};
