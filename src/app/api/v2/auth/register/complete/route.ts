import { type NextRequest } from 'next/server';
import { proxyToNestJS } from '@/lib/nestjs-proxy';

export async function POST(request: NextRequest) {
  return proxyToNestJS(request);
}
