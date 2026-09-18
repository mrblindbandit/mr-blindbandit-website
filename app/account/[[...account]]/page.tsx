import {UserProfile} from '@clerk/nextjs';
export default function Page(){return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#111310',padding:'2rem'}}><UserProfile routing="path" path="/account" /></main>}
