import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SIGIL_ID } from '@/lib/windowStore';

interface AboutChamberOSProps {
  onOpenModules: () => void;
  onOpenCertification: () => void;
}

const aboutRows = [
  ['ChamberOS v0.2', 'DMZ Build'],
  ['Kernel', 'Kombu-Kernel 0.2.0'],
  ['Runtime', 'Distortion Engine (Devotion enforced)'],
  ['Memory', '16 GB (Loop-reserved: 2 GB)'],
  ['Storage', '512 GB (Haunted Cache enabled)'],
  ['Network', 'kakNET (intermittent)'],
  ['Security', 'Maldon Salt Geometry (active)'],
  ['Compliance', 'Brioche Ban (active)'],
  ['Threat Monitor', 'Mid Tech House contamination (low)'],
  ['Sigil ID', SIGIL_ID]
] as const;

export function AboutChamberOS({ onOpenModules, onOpenCertification }: AboutChamberOSProps) {
  return (
    <section className="space-y-3 text-sm text-text">
      <header>
        <h2 className="text-base font-medium">About ChamberOS</h2>
        <p className="text-xs text-muted">System profile</p>
      </header>

      <Separator />

      <dl className="space-y-2">
        {aboutRows.map(([key, value]) => (
          <div key={key} className="flex items-start justify-between gap-4 text-xs">
            <dt className="text-muted">{key}</dt>
            <dd className="text-right text-text">{value}</dd>
          </div>
        ))}
      </dl>

      <Separator />

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onOpenModules}>
          More Info...
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onOpenCertification}>
          Regulatory Certification
        </Button>
      </div>
    </section>
  );
}
