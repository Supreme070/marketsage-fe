import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { isAuthorizedAdmin, getAdminConfig } from '@/lib/admin-config';

/**
 * Check if the current session has admin access
 * Uses centralized admin configuration for consistency
 */
export async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    console.log('Admin Auth: No session found');
    return { authorized: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const config = getAdminConfig();
  console.log('Admin Auth: Environment:', process.env.NODE_ENV);
  console.log('Admin Auth: ADMIN_ENABLED env var:', process.env.ADMIN_ENABLED);
  console.log('Admin Auth: Config enabled:', config.enabled);
  console.log('Admin Auth: User email:', session.user.email);
  console.log('Admin Auth: User role:', (session.user as any).role);
  
  // Check admin configuration
  if (!config.enabled) {
    console.log('Admin Auth: Admin portal is disabled');
    return { authorized: false, response: NextResponse.json({ error: 'Admin portal is disabled' }, { status: 503 }) };
  }
  
  // Check if user is authorized using centralized config
  const userEmail = session.user.email || '';
  const userRole = (session.user as any)?.role;
  const isAuthorized = isAuthorizedAdmin(userEmail, userRole);
  
  console.log('Admin Auth: Is authorized:', isAuthorized);
  
  if (!isAuthorized) {
    return { authorized: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  
  return { authorized: true, session };
}

/**
 * Check if the current session has super admin access
 */
export async function checkSuperAdminAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { authorized: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  
  // Special case for supreme user during development
  const isSupremeUser = session.user.email === 'supreme' || session.user.email === 'supreme@marketsage.africa';
  
  // Check if user has super admin role or is supreme user
  const userRole = (session.user as any).role;
  const hasSuperAdminRole = userRole === 'SUPER_ADMIN';
  
  if (!isSupremeUser && !hasSuperAdminRole) {
    return { authorized: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  
  return { authorized: true, session };
}