import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies, request, redirect }) => {

    cookies.set('session', '', {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
        maxAge: 0
    });

    if (request.headers.get('referer') != "http://localhost:4321/") {
        return redirect('/login');
    }

    return redirect('/');
};
