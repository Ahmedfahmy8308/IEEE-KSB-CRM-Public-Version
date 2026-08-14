import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome Day Management',
  description:
    'Welcome Day attendee check-in, QR verification, attendance tracking, and statistics.',
};

export default function WelcomeDayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
