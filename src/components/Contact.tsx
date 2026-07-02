import { useState } from 'react';
import { useReveal } from '../hooks/useReveal';

import './Contact.scss';

interface ContactInfo {
  name: string;
  class: string;
  value: string;
  link?: string;
}

interface ContactData {
  title: string;
  label: string;
  tagline: string;
  contactInfo: {
    title: string;
    description: string;
    items: ContactInfo[];
  };
  send: { text: string };
  success: { headerText: string; bodyText: string };
  error: { headerText: string; bodyText: string };
}

const contactIcons: Record<string, string> = {
  Email: '✉️',
  LinkedIn: '💼',
  GitHub: '🐙',
  Phone: '📱',
};

export default function Contact({ contact }: { contact: ContactData }) {
  const { ref, visible } = useReveal();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    // Simulate send - integrate your own email API
    setTimeout(() => {
      setStatus('sent');
      setForm({ name: '', email: '', message: '' });
    }, 1500);
  };

  return (
    <section id="contact" className="section" aria-labelledby="contact-heading">
      <div className="section__head">
        <p className="section__label">{contact.label}</p>
        <h2 id="contact-heading" className="section__title">{contact.title}</h2>
        <p className="section__sub">{contact.tagline}</p>
      </div>

      <div ref={ref} className={`contact__grid ${visible ? 'reveal--visible' : 'reveal'}`}>
        {/* Contact Info */}
        <div className="contact__info">
          <h3 className="contact__info-title">{contact.contactInfo.title}</h3>
          <p className="contact__info-desc">{contact.contactInfo.description}</p>

          <ul className="contact__list">
            {contact.contactInfo.items.map((item) => (
              <li key={item.name} className="contact__item">
                <span className="contact__item-icon" aria-hidden="true">
                  {contactIcons[item.name] || '🔗'}
                </span>
                <div>
                  <span className="contact__item-label">{item.name}</span>
                  {item.link ? (
                    <a
                      href={item.link}
                      className="contact__item-value"
                      target={item.link.startsWith('http') ? '_blank' : undefined}
                      rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {item.value}
                    </a>
                  ) : (
                    <span className="contact__item-value">{item.value}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Form */}
        <form className="contact__form" onSubmit={handleSubmit}>
          {status === 'sent' ? (
            <div className="contact__success">
              <span className="contact__success-icon">✅</span>
              <h3>{contact.success.headerText}</h3>
              <p>{contact.success.bodyText}</p>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setStatus('idle')}
              >
                Send another message
              </button>
            </div>
          ) : (
            <>
              <div className="contact__field">
                <label htmlFor="contact-name">Name</label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div className="contact__field">
                <label htmlFor="contact-email">Email</label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <div className="contact__field">
                <label htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell me about your project..."
                />
              </div>
              <button
                type="submit"
                className="btn btn--primary contact__submit"
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'Sending...' : contact.send.text}
              </button>
            </>
          )}
        </form>
      </div>
    </section>
  );
}
