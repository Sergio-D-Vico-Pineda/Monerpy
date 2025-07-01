import type { APIRoute } from 'astro';
import { validateCredentials } from '@lib/auth.ts';

export const POST: APIRoute = async ({ cookies, request, redirect }) => {
  try {
    const formData = await request.formData();
    const email = formData.get('email')?.toString() || '';
    const password = formData.get('password')?.toString() || '';
    const remember = formData.get('remember') === 'on';

    const result = await validateCredentials(email, password);

    if (!result.success) {
      const errorMap: Record<string, string> = {
        missing_credentials: 'missing',
        user_not_found: 'email',
        invalid_password: 'password',
        account_deleted: 'deleted',
        server_error: 'server'
      };

      return redirect(`/login?error=${errorMap[result.error || 'server']}`);
    }

    console.log('Login successful:', result);

    // Create secure session cookie
    const session = {
      userId: result.user!.id,
      email: result.user!.email,
      created: new Date().toISOString()
    };

    // Set session cookie with secure options
    const maxAge = remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days if remember, 24 hours if not

    cookies.set('session', JSON.stringify(session), {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
      maxAge: maxAge
    });
    return redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    return redirect('/login?error=server');
  }
};

/* export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}; */