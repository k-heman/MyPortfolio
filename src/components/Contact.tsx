import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
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

function renderContactIcon(name: string) {
  const size = 20;
  switch (name) {
    case 'Email':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      );
    case 'LinkedIn':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
      );
    case 'GitHub':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      );
    case 'Instagram':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
  }
}

export default function Contact({ contact }: { contact: ContactData }) {
  const { ref, visible } = useReveal();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    
    try {
      await addDoc(collection(db, 'messages'), {
        name: form.name,
        email: form.email,
        message: form.message,
        createdAt: serverTimestamp(),
      });
      setStatus('sent');
      setForm({ name: '', email: '', message: '' });
    } catch (error) {
      console.error("Error sending message: ", error);
      setStatus('error'); // Alternatively handle error state gracefully
      // Falling back to idle so they can try again, or you could add an explicit error UI
      setStatus('idle'); 
    }
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
                  {renderContactIcon(item.name)}
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
