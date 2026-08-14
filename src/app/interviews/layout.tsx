import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Interviews Dashboard',
  description: 'Candidate interviews, scheduling, evaluations, and committee management.',
};

export default function InterviewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
