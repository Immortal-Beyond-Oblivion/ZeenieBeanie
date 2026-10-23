import './Contact.css';

/* The three contact paths. These values are canonical — they are
   used exactly as given, never reformatted or invented. */
const PHONE_DISPLAY = '+91 78560 24432';
const PHONE_HREF = 'tel:+91 78560 24432';
const EMAIL_DISPLAY = 'zeebee2510@gmail.com';
const EMAIL_HREF = 'mailto:zeebee2510@gmail.com';
const WHATSAPP_HREF =
  "https://wa.me/917856024432?text=Hello%20%21%20I'd%20like%20to%20book%20a%20trial%20Spanish%20class.";

function WhatsAppIcon() {
  return (
    <svg className="contact-link__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 5 h16 a2 2 0 0 1 2 2 v8 a2 2 0 0 1 -2 2 h-8 l-5 4 v-4 h-3 a2 2 0 0 1 -2 -2 v-8 a2 2 0 0 1 2 -2 z" />
      <path d="M8.5 10.5 h.01 M12 10.5 h.01 M15.5 10.5 h.01" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="contact-link__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 3.5 h3 l2 5 -2.4 1.6 a12 12 0 0 0 5.3 5.3 l1.6 -2.4 5 2 v3 a2 2 0 0 1 -2.2 2 A16.5 16.5 0 0 1 4 5.7 2 2 0 0 1 6 3.5 z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="contact-link__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3.8 7 L12 13 l8.2 -6" />
    </svg>
  );
}

function Contact() {
  return (
    <section id="contact" className="contact" aria-labelledby="contact-title">
      <div className="contact-panel">
        <header className="contact-head">
          <p className="contact-kicker">Three ways to reach me</p>
          <h2 id="contact-title" className="contact-title">
            Get in touch
          </h2>
          <p className="contact-intro">
            Any of these reaches me directly. Pick whichever suits you — a quick
            message, a phone call, or a note by email.
          </p>
        </header>

        <ul className="contact-grid">
          <li className="contact-item">
            <a
              className="contact-link"
              href={WHATSAPP_HREF}
              aria-label="WhatsApp the instructor about a trial class"
            >
              <span className="contact-link__badge">
                <WhatsAppIcon />
              </span>
              <span className="contact-link__name">WhatsApp</span>
              <span className="contact-link__desc">
                Message the instructor about a trial class.
              </span>
              <span className="contact-link__value">Open WhatsApp</span>
            </a>
          </li>

          <li className="contact-item">
            <a
              className="contact-link"
              href={PHONE_HREF}
              aria-label="Phone: call the instructor on +91 78560 24432"
            >
              <span className="contact-link__badge">
                <PhoneIcon />
              </span>
              <span className="contact-link__name">Phone</span>
              <span className="contact-link__desc">Tap to call the instructor.</span>
              <span className="contact-link__value">{PHONE_DISPLAY}</span>
            </a>
          </li>

          <li className="contact-item">
            <a
              className="contact-link"
              href={EMAIL_HREF}
              aria-label="Email the instructor at zeebee2510@gmail.com"
            >
              <span className="contact-link__badge">
                <MailIcon />
              </span>
              <span className="contact-link__name">Email</span>
              <span className="contact-link__desc">Tap to write to the instructor.</span>
              <span className="contact-link__value">{EMAIL_DISPLAY}</span>
            </a>
          </li>
        </ul>

        <div className="contact-cta">
          <h3 className="contact-cta__title">Book a trial class</h3>
          <p className="contact-cta__copy">
            If you’re curious, a trial class is the easiest way to see how we work
            together. Send a message whenever you’re ready and we’ll take it from
            there.
          </p>
          <div className="contact-cta__actions">
            <a className="contact-btn contact-btn--primary" href={WHATSAPP_HREF}>
              Book a trial class on WhatsApp
            </a>
            {/* The "or" is a connector between two routes, not part
                of either link's name — so it stays out of the
                accessibility tree. */}
            <span className="contact-cta__or" aria-hidden="true">or</span>
            <a className="contact-btn contact-btn--ghost" href={EMAIL_HREF}>
              Send an email to the instructor
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
