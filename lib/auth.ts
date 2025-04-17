import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '../stack';

// Middleware for Next.js only
export async function auth(req: NextRequest) {
  // Allow unauthenticated access to the homepage
  if (req.nextUrl.pathname === '/') {
    return NextResponse.next();
  }

  const user = await stackServerApp.getUser();
  const isAuthPage = req.nextUrl.pathname === '/handler/signin' || req.nextUrl.pathname.startsWith('/api/auth');

  if (!user && !isAuthPage) {
    const signinUrl = new URL('/handler/signin', req.url);
    return NextResponse.redirect(signinUrl);
  }

  return NextResponse.next();
}

// For server components: use this to get the user
export const getUser = () => stackServerApp.getUser();
