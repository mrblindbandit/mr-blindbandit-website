import {SignUp} from '@clerk/nextjs';
export default function Page(){return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#111310',padding:'2rem'}}><SignUp routing="path" path="/sign-up" fallbackRedirectUrl="/portal/" signInUrl="/sign-in" /></main>}
