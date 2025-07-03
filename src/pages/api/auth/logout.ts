import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies, request, redirect }) => {

    const isSecureEnvironment = request.url.startsWith('https://');

    cookies.set('session', '', {
        path: '/',
        httpOnly: true,
        sameSite: isSecureEnvironment ? 'strict' : 'lax',
        secure: isSecureEnvironment,
        maxAge: 0
    });

    if (request.headers.get('referer') != "http://localhost:4321/") {
        return redirect('/login');
    }

    return redirect('/');
};
