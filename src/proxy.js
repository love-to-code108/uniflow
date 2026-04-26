import { NextResponse } from 'next/server';

export function proxy(request) {
    // 1. Check for the secure session cookie we set during login
    const sessionCookie = request.cookies.get("session")?.value;

    // 2. Define your public routes (pages anyone can access without logging in)
    const isPublicRoute = request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/login';

    // 3. The Bouncer Logic: 
    // If they have NO cookie and are trying to access a private page...
    if (!sessionCookie && !isPublicRoute) {
        // Instantly redirect them to the home page
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Optional UX Bonus: If they ARE logged in, but try to go to the login page,
    // redirect them to their workspace/dashboard so they don't see the login form again.
    if (sessionCookie && request.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/workspace', request.url)); // Change '/workspace' to your main app route
    }

    // Otherwise, let them pass
    return NextResponse.next();
}

// 4. The Configuration:
// This tells Next.js which paths the middleware should actually run on.
export const config = {
    matcher: [
        /*
         * Match all request paths EXCEPT for the ones starting with:
         * - api (API routes)
         * - _next/static (static files like CSS/JS)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};