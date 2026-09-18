import {createClerkClient} from '@clerk/backend';
import type {PortalEnv} from './portal-auth';

export async function clerkIdentity(request:Request,env:PortalEnv){
 const publishableKey=env.CLERK_PUBLISHABLE_KEY||env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
 if(!publishableKey||!env.CLERK_SECRET_KEY)return null;
 const clerk=createClerkClient({publishableKey,secretKey:env.CLERK_SECRET_KEY});
 const state=await clerk.authenticateRequest(request,{authorizedParties:['https://mrblindbandit.net','https://www.mrblindbandit.net','https://portal.mrblindbandit.net','https://api.mrblindbandit.net','https://mr-blind-bandit.mrblindbandit.chatgpt.site']});
 if(!state.isSignedIn)return null;
 const auth=state.toAuth();
 const user=await clerk.users.getUser(auth.userId);
 const primary=user.emailAddresses.find(e=>e.id===user.primaryEmailAddressId);
 const email=primary?.verification?.status==='verified'?primary.emailAddress.toLowerCase():null;
 return email?{clerkUserId:user.id,email,recentFirstFactor:auth.has({reverification:{level:'first_factor',afterMinutes:5}})}:null;
}
