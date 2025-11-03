import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Für Embed-Seite: Header setzen, die iFrame-Einbettung erlauben
  if (request.nextUrl.pathname.startsWith('/embed')) {
    // Entferne X-Frame-Options komplett (sonst kann nicht eingebettet werden)
    response.headers.delete('X-Frame-Options');
    
    // Setze Content-Security-Policy um iFrame-Einbettung zu erlauben
    // Erlaubt alle HTTPS und HTTP Seiten (inkl. localhost für lokale Entwicklung)
    // Wichtig: Nur wenn in Produktion, für lokales Testing besser ganz weglassen
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      response.headers.set('Content-Security-Policy', "frame-ancestors 'self' https: http:");
    }
    // In Entwicklung: Kein CSP-Header, damit lokale Einbettung funktioniert
    
    // Zusätzlich: Permissions-Policy
    response.headers.set('Permissions-Policy', 'display-capture=*, fullscreen=*');
  }

  return response;
}

export const config = {
  matcher: '/embed/:path*',
};


