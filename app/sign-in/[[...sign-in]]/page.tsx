import {SignIn} from '@clerk/nextjs';
export default function Page(){return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#111310',padding:'2rem'}}><SignIn routing="path" path="/sign-in" fallbackRedirectUrl="/portal/" signUpUrl="/sign-up" /></main>}
