import styles from './contact.module.css';

export default function InquiryFields({ honeypot }: { honeypot: string }) {
  return (
    <>
      <label>your email<input type="email" name="email" autoComplete="email" maxLength={254} required /></label>
      <label>message<textarea name="message" rows={5} maxLength={4000} required /></label>
      <div className={styles.trap} aria-hidden="true">
        <label>website<input name={honeypot} tabIndex={-1} autoComplete="off" /></label>
      </div>
    </>
  );
}
