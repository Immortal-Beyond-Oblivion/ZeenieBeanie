import './Footer.css';

/* Small and quiet — the contact details stay reachable here too.
   These values are canonical and are used exactly as given. */
const PHONE_DISPLAY = '+91 7856024432';
const PHONE_HREF = 'tel:+917856024432';
const EMAIL_DISPLAY = 'zeebee2510@gmail.com';
const EMAIL_HREF = 'mailto:zeebee2510@gmail.com';
const WHATSAPP_HREF =
  "https://wa.me/917856024432?text=Hello%20%21%20I'd%20like%20to%20book%20a%20trial%20Spanish%20class.";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p className="site-footer__line">
          One-to-one Spanish lessons · Beginner to intermediate · Master’s degree in
          Spanish
        </p>

        <ul className="site-footer__links">
          <li>
            <a
              className="site-footer__link"
              href={WHATSAPP_HREF}
              aria-label="WhatsApp the instructor about a trial class"
            >
              WhatsApp
            </a>
          </li>
          <li>
            <a
              className="site-footer__link"
              href={PHONE_HREF}
              aria-label="Call the instructor on +91 7856024432"
            >
              {PHONE_DISPLAY}
            </a>
          </li>
          <li>
            <a
              className="site-footer__link"
              href={EMAIL_HREF}
              aria-label="Email the instructor at zeebee2510@gmail.com"
            >
              {EMAIL_DISPLAY}
            </a>
          </li>
        </ul>

        <p className="site-footer__fine">Send a message whenever you’re ready.</p>
      </div>
    </footer>
  );
}

export default Footer;
