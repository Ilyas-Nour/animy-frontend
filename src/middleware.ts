import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames
  // We exclude api, _next, and any files with extensions
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
