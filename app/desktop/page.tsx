import ResidentDesktop from '@/components/desktop/ResidentDesktop';
import VisitorLogin from './VisitorLogin';

export default function DesktopPage() {
  return process.env.CHAMBER_DESKTOP_OPEN === 'true' ? <ResidentDesktop /> : <VisitorLogin />;
}
