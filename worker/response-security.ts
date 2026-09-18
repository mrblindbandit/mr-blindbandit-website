/** Apply headers to Worker-generated responses as well as static assets. */
export function responseSecurity(response:Response,request:Request):Response {
 const headers=new Headers(response.headers);
 if(new URL(request.url).pathname.startsWith('/support/payment/')){headers.set('X-Robots-Tag','noindex, nofollow');headers.set('Cache-Control','private, no-store');headers.set('Referrer-Policy','no-referrer');}
 headers.set('X-Content-Type-Options','nosniff');
 if(!headers.has('Referrer-Policy'))headers.set('Referrer-Policy','strict-origin-when-cross-origin');
 headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=(), payment=()');
 if(new URL(request.url).protocol==='https:')headers.set('Strict-Transport-Security','max-age=86400');
 // Framing policy only: third-party authentication, media workers and embeds
 // need a separately verified full resource CSP before enforcement.
 if(headers.get('content-type')?.includes('text/html')&&!headers.has('Content-Security-Policy'))headers.set('Content-Security-Policy',"frame-ancestors 'self'; object-src 'none'; base-uri 'self'");
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
