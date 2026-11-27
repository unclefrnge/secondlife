'use client';

import { useId } from 'react';
import { HANDOVER_FILE, type ClosingChoice, type GateProgress, type IntercomStage, type ReplyChoice } from '@/lib/intercom';

interface ChamberIntercomProps {
  ready: boolean;
  durable: boolean;
  stage: IntercomStage;
  progress: GateProgress;
  onReply: (choice: ReplyChoice) => void;
  onClose: (choice: ClosingChoice) => void;
  onOpenFile: (id: string, origin: { x: number; y: number }) => void;
}

const firstMessage = 'Knight, Adriaan says you’ve got the spare key.';
const replyLabels: Record<ReplyChoice, string> = { 'which-key': 'Which key?', 'check-folder': 'Check the folder.' };
const closingLabels: Record<ClosingChoice, string> = { 'bring-usb': 'I’ll bring it.', 'leave-with-sam': 'Leave it with Sam.' };

export function ChamberIntercom({ ready, durable, stage, progress, onReply, onClose, onOpenFile }: ChamberIntercomProps) {
  const headingId = useId();
  const delivery = progress.choice === 'which-key'
    ? 'The gate key. Adriaan gave me a USB. There’s a note on it. I’ve sent it through.'
    : 'Found the folder. One note. It says ask Sam. I’ve sent it through.';
  const followUp = 'Sam’s on his way with the key. Can you bring the USB back? It’s got the playlist on it.';
  const closing = progress.closingChoice === 'bring-usb' ? 'Thanks. I’ll be at the gate.' : 'I’ve left him a note. He’ll collect it from you.';
  const message = !ready ? 'Connecting…' : stage === 'unanswered' ? firstMessage : stage === 'waiting'
    ? 'Parker is checking.' : stage === 'delivered' ? delivery : stage === 'follow-up' ? followUp : closing;
  const hasFile = ready && ['delivered', 'follow-up', 'closed'].includes(stage);

  return (
    <section className="chamber-intercom" aria-labelledby={headingId}>
      <header className="chamber-intercom-header">
        <h2 id={headingId}>chamber line</h2>
        <span className="chamber-intercom-status">{stage === 'closed' ? 'Quiet' : stage === 'waiting' ? 'On the line' : 'Local'}</span>
      </header>
      <div className="chamber-intercom-body">
        <p className="chamber-intercom-caller">Parker <span>Melville gate</span></p>
        <p className="chamber-intercom-message" aria-live="polite" aria-atomic="true">{message}</p>

        {ready && stage === 'unanswered' ? <div className="chamber-intercom-actions">
          <button type="button" onClick={() => onReply('which-key')}>Which key?</button>
          <button type="button" onClick={() => onReply('check-folder')}>Check the folder</button>
        </div> : null}
        {ready && stage === 'follow-up' ? <div className="chamber-intercom-actions">
          <button type="button" onClick={() => onClose('bring-usb')}>I’ll bring it</button>
          <button type="button" onClick={() => onClose('leave-with-sam')}>Leave it with Sam</button>
        </div> : null}
        {hasFile ? <button
          type="button"
          className="chamber-intercom-file"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            onOpenFile(HANDOVER_FILE, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
          }}
        >gate-handover.txt <span>INCOMING/ ↗</span></button> : null}

        {ready && progress.choice ? <details className="chamber-intercom-history">
          <summary>Earlier messages</summary>
          <ol>
            <li><span>Parker</span>{firstMessage}</li>
            <li><span>You</span>{replyLabels[progress.choice]}</li>
            {stage !== 'waiting' ? <li><span>Parker</span>{delivery}</li> : null}
            {stage === 'closed' && progress.closingChoice ? <><li><span>Parker</span>{followUp}</li><li><span>You</span>{closingLabels[progress.closingChoice]}</li></> : null}
          </ol>
        </details> : null}
        {!durable ? <p className="chamber-intercom-status">Progress is kept for this visit only.</p> : null}
      </div>
    </section>
  );
}
