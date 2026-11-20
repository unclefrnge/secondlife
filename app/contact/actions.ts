'use server';

import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { frnge } from '@/lib/config';
import { contactSettings } from '@/lib/contact-settings';

export async function submitInquiry(data: FormData) {
  const settings = contactSettings();
  const unavailable = { ok: false, message: 'The form is temporarily unavailable. Try again later.' };
  if (settings.mode !== 'mail' && settings.mode !== 'preview') return unavailable;

  const text = (key: string) => {
    const value = data.get(key);
    return typeof value === 'string' ? value.trim() : '';
  };
  const email = text('email');
  const message = text('message');
  const token = text('cf-turnstile-response');
  const id = text('requestId');
  if (text('website') || !/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id)) {
    return { ok: false, message: 'Please reopen the form and try again.' };
  }
  if (email.length > 254 || !/^[^\s@,<>"():;\\]+@[^\s@,<>"():;\\]+\.[^\s@,<>"():;\\]+$/.test(email) || !message || message.length > 4000) {
    return { ok: false, message: 'Enter your email address and a message of up to 4,000 characters.' };
  }
  const challengeFailed = { ok: false, message: 'Please complete the spam check again.' };
  if (!token || token.length > 2048) return challengeFailed;

  try {
    const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: settings.secret, response: token }),
      signal: AbortSignal.timeout(10000),
      cache: 'no-store'
    });
    if (!verification.ok) return unavailable;
    const check = await verification.json();
    if (check.success !== true || (settings.mode === 'mail' && check.action !== 'contact')) return challengeFailed;

    // Preserve the same delivery key when a visitor retries after a lost response.
    const key = createHash('sha256').update(JSON.stringify([id, email, message])).digest('hex');
    if (settings.mode === 'preview') {
      await mkdir(settings.directory, { recursive: true, mode: 0o700 });
      try {
        await writeFile(path.join(settings.directory, key + '.json'), JSON.stringify({ email, message }), { flag: 'wx', mode: 0o600 });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      }
      return { ok: true, message: 'Test inquiry saved on this computer.' };
    }

    const delivery = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + settings.apiKey,
        'Content-Type': 'application/json',
        'Idempotency-Key': 'contact/' + key
      },
      body: JSON.stringify({
        from: settings.sender, to: [frnge.email], reply_to: email,
        subject: 'FRNGE website inquiry', text: message
      }),
      signal: AbortSignal.timeout(10000),
      cache: 'no-store'
    });
    if (!delivery.ok || !(await delivery.json()).id) return unavailable;
    return { ok: true, message: 'Thanks. Your inquiry has been submitted.' };
  } catch {
    return unavailable;
  }
}
