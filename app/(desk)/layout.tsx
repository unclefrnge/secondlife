import type { ReactNode } from 'react';
import { PublicDesktop } from '@/app/work/PublicDesktop';
import { WelcomeContent } from '@/components/welcome/WelcomeContent';

export default function PublicDeskLayout({ children }: { children: ReactNode }) {
  return <><PublicDesktop welcome={<WelcomeContent />} />{children}</>;
}
