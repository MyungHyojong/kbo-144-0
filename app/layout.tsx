import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import './overrides.css';
export const metadata: Metadata = { title: '144–0 | KBO Dream Team', description: 'Build a legendary KBO roster.' };
export default function Layout({children}:{children:React.ReactNode}) { return <html lang="ko"><body>{children}<Analytics /></body></html>; }
