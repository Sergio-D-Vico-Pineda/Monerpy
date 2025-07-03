import type { APIRoute } from 'astro';
import { validateCredentials } from '@lib/auth.ts';

export const POST: APIRoute = async ({ cookies, request }) => {
  try {
    const formData = await request.formData();
    const email = formData.get('email')?.toString() || '';
    const password = formData.get('password')?.toString() || '';
    const remember = formData.get('remember') === 'on';

    const result = await validateCredentials(email, password);

    if (!result.success) {
      const errorMessages: Record<string, string> = {
        missing_credentials: 'Please enter both email and password',
        user_not_found: 'Email not found',
        invalid_password: 'Incorrect password',
        account_deleted: 'This account has been deleted',
        server_error: 'An error occurred. Please try again later'
      };

      return new Response(JSON.stringify({
        success: false,
        message: errorMessages[result.error || 'server_error']
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
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

    // Determine if we're in a secure environment
    const isSecureEnvironment = request.url.startsWith('https://');

    cookies.set('session', JSON.stringify(session), {
      path: '/',
      httpOnly: true,
      sameSite: isSecureEnvironment ? 'strict' : 'lax',
      secure: isSecureEnvironment, // Only require secure for HTTPS
      maxAge: maxAge
    });

    return new Response(JSON.stringify({
      success: true,
      redirect: '/dashboard'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'An error occurred. Please try again later'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
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