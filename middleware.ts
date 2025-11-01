import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Für Embed-Seite: Header setzen, die iFrame-Einbettung erlauben
  if (request.nextUrl.pathname.startsWith('/embed')) {
    // Entferne X-Frame-Options komplett
    response.headers.delete('X-Frame-Options');
    
    // Setze Content-Security-Policy um iFrame-Einbettung zu erlauben
    response.headers.set('Content-Security-Policy', "frame-ancestors *");
    
    // Zusätzlich: Permissions-Policy
    response.headers.set('Permissions-Policy', 'display-capture=*, fullscreen=*');
  }

  return response;
}

export const config = {
  matcher: '/embed/:path*',
};

