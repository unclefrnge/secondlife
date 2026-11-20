// Read settings only on the server. The page passes the public widget key to the form.
export function contactSettings() {
  const previewInbox = process.env.CONTACT_PREVIEW_INBOX;
  if (previewInbox && !process.env.VERCEL) {
    return {
      mode: 'preview' as const,
      directory: previewInbox,
      siteKey: '1x00000000000000000000AA',
      secret: '1x0000000000000000000000000000000AA'
    };
  }

  const siteKey = process.env.TURNSTILE_SITE_KEY;
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const sender = process.env.CONTACT_FROM_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  if (siteKey && secret && sender && apiKey && !/^[123]x0{10}/.test(siteKey) && !/^[123]x0{10}/.test(secret)) {
    return { mode: 'mail' as const, siteKey, secret, sender, apiKey };
  }

  return { mode: 'offline' as const };
}
