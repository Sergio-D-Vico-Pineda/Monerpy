export function isAuthenticated(request: Request) {
  const cookies = request.headers.get('cookie');
  if (!cookies) return false;

  const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('session='));
  if (!sessionCookie) return false;

  try {
    const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
    return session.userId ? true : false;
  } catch {
    return false;
  }
}
