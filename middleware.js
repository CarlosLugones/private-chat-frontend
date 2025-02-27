import { NextResponse } from 'next/server';

export default function middleware(request) {
  // For WebSocket upgrade requests
  if (request.headers.get('upgrade') === 'websocket') {
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/ws',
};
