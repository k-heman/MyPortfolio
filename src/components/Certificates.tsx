import { useState, useEffect, useMemo, TouchEvent, MouseEvent as ReactMouseEvent } from 'react';
import { Icon } from '@iconify/react';

import { useReveal } from '../hooks/useReveal';
import type { Certificate } from '../types';

import './Certificates.scss';

interface CertificatesProps {
  certificates?: Certificate[];
  isLoading?: boolean;
}

export default function Certificates({ certificates = [], isLoading = false }: CertificatesProps) {
  const { ref, visible } = useReveal();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isClosingLightbox, setIsClosingLightbox] = useState(false);

  // Parallax mouse position state (section-level)
  const [sectionMouse, setSectionMouse] = useState({ x: 0, y: 0 });

  // 3D Tilt state per card (card-level)
  const [cardTilts, setCardTilts] = useState<Record<number, { rx: number; ry: number; active: boolean }>>({});

  // Touch swipe state for mobile lightbox
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Filter published & sort by displayOrder ASC
  const publishedCertificates = useMemo(() => {
    return certificates
      .filter((cert) => {
        const s = (cert.status || '').toLowerCase();
        return s === 'published';
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [certificates]);

  const activeCert = lightboxIndex !== null ? publishedCertificates[lightboxIndex] : null;

  // Handle Section Mouse Move for Parallax Effect
  const handleSectionMouseMove = (e: ReactMouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const normX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const normY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    setSectionMouse({ x: normX, y: normY });
  };

  const handleSectionMouseLeave = () => {
    setSectionMouse({ x: 0, y: 0 });
  };

  // Handle Card 3D Tilt
  const handleCardMouseMove = (index: number, e: ReactMouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const px = e.clientX - rect.left - rect.width / 2;
    const py = e.clientY - rect.top - rect.height / 2;
    const rx = -(py / (rect.height / 2)) * 8; // Max 8 deg rotateX
    const ry = (px / (rect.width / 2)) * 8; // Max 8 deg rotateY
    setCardTilts((prev) => ({ ...prev, [index]: { rx, ry, active: true } }));
  };

  const handleCardMouseLeave = (index: number) => {
    setCardTilts((prev) => ({ ...prev, [index]: { rx: 0, ry: 0, active: false } }));
  };

  // Close Lightbox with Smooth Exit Animation
  const handleCloseLightbox = () => {
    if (isClosingLightbox) return;
    setIsClosingLightbox(true);
    setTimeout(() => {
      setLightboxIndex(null);
      setIsClosingLightbox(false);
    }, 220);
  };

  // Lock scroll when lightbox is open
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightboxIndex]);

  // Keyboard navigation: Escape to close, Left/Right arrows to navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null || publishedCertificates.length === 0) return;

      if (e.key === 'Escape') {
        handleCloseLightbox();
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev !== null ? (prev - 1 + publishedCertificates.length) % publishedCertificates.length : 0
        );
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev !== null ? (prev + 1) % publishedCertificates.length : 0
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex, publishedCertificates.length]);

  const handlePrev = () => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + publishedCertificates.length) % publishedCertificates.length : 0
    );
  };

  const handleNext = () => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % publishedCertificates.length : 0
    );
  };

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e: TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 40;
    const isRightSwipe = distance < -40;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };

  // Float variation helper per card index
  const getFloatParams = (index: number) => {
    const floatDurs = ['6.8s', '8.2s', '7.4s', '8.6s', '6.2s', '7.9s'];
    const floatDelays = ['0s', '-2.1s', '-4.3s', '-1.5s', '-3.7s', '-5.2s'];
    const floatY = [10, -12, 9, -11, 12, -8];
    const floatX = [4, -5, 6, -4, 5, -3];
    const depthScales = [1.0, 1.02, 0.98, 1.01, 0.99, 1.02];

    const idx = index % floatDurs.length;
    return {
      dur: floatDurs[idx],
      delay: floatDelays[idx],
      fy: floatY[idx],
      fx: floatX[idx],
      scale: depthScales[idx],
    };
  };

  return (
    <section
      id="certificates"
      className="section certificates"
      aria-labelledby="certificates-heading"
      onMouseMove={handleSectionMouseMove}
      onMouseLeave={handleSectionMouseLeave}
    >
      {/* Background Ambient Orbs */}
      <div className="certificates__orbs" aria-hidden="true">
        <div className="certificates__orb certificates__orb--1" />
        <div className="certificates__orb certificates__orb--2" />
        <div className="certificates__orb certificates__orb--3" />
      </div>

      <div className="section__head section__head--centered">
        <p className="section__label">Credentials</p>
        <h2 id="certificates-heading" className="section__title">Certificates</h2>
        <p className="section__sub">A collection of my professional certifications and achievements.</p>
      </div>

      <div ref={ref} className={`certificates__content ${visible ? 'reveal--visible' : 'reveal'}`}>
        {isLoading ? (
          /* Skeleton Loader */
          <div className="certificates__grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="certificates__skeleton-card">
                <div className="certificates__skeleton-shimmer" />
              </div>
            ))}
          </div>
        ) : publishedCertificates.length === 0 ? (
          /* Empty State */
          <div className="certificates__empty">
            <p className="certificates__empty-text">Certificates will be added soon.</p>
          </div>
        ) : (
          /* Floating & Staggered Certificate Cards Grid */
          <div className="certificates__grid">
            {publishedCertificates.map((cert, index) => {
              const floatParams = getFloatParams(index);
              const tilt = cardTilts[index] || { rx: 0, ry: 0, active: false };

              // Section Parallax displacement multiplier
              const parallaxFactor = (index % 2 === 0 ? 1 : -1) * 8;
              const px = sectionMouse.x * parallaxFactor;
              const py = sectionMouse.y * 6;

              const cardStyle: React.CSSProperties = {
                '--float-dur': floatParams.dur,
                '--float-delay': floatParams.delay,
                '--float-y': `${floatParams.fy}px`,
                '--float-x': `${floatParams.fx}px`,
                '--depth-scale': floatParams.scale,
                '--parallax-x': `${px}px`,
                '--parallax-y': `${py}px`,
                '--tilt-rx': `${tilt.rx}deg`,
                '--tilt-ry': `${tilt.ry}deg`,
              } as React.CSSProperties;

              return (
                <div
                  key={cert.id || index}
                  className={`certificates__card-wrapper ${tilt.active ? 'certificates__card-wrapper--tilted' : ''}`}
                  style={cardStyle}
                >
                  <button
                    type="button"
                    className="certificates__card"
                    onClick={() => {
                      setIsClosingLightbox(false);
                      setLightboxIndex(index);
                    }}
                    onMouseMove={(e) => handleCardMouseMove(index, e)}
                    onMouseLeave={() => handleCardMouseLeave(index)}
                    aria-label={`View certificate: ${cert.title}`}
                  >
                    <div className="certificates__card-image-wrapper">
                      <img
                        src={cert.imageUrl}
                        alt={cert.title}
                        className="certificates__card-img"
                        loading="lazy"
                      />
                      <div className="certificates__glass-sheen" aria-hidden="true" />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Expand Lightbox Viewer */}
      {lightboxIndex !== null && activeCert && (
        <div
          className={`certificates__lightbox-overlay ${
            isClosingLightbox ? 'certificates__lightbox-overlay--closing' : ''
          }`}
          onClick={handleCloseLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Certificate Fullscreen Viewer"
        >
          <div
            className={`certificates__lightbox-modal ${
              isClosingLightbox ? 'certificates__lightbox-modal--closing' : ''
            }`}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Close Button */}
            <button
              type="button"
              className="certificates__lightbox-close"
              onClick={handleCloseLightbox}
              aria-label="Close fullscreen view"
            >
              <Icon icon="ph:x-bold" width="22" height="22" />
            </button>

            {/* Navigation Buttons */}
            {publishedCertificates.length > 1 && (
              <>
                <button
                  type="button"
                  className="certificates__lightbox-nav certificates__lightbox-nav--prev"
                  onClick={handlePrev}
                  aria-label="Previous certificate"
                >
                  <Icon icon="ph:caret-left-bold" width="24" height="24" />
                </button>

                <button
                  type="button"
                  className="certificates__lightbox-nav certificates__lightbox-nav--next"
                  onClick={handleNext}
                  aria-label="Next certificate"
                >
                  <Icon icon="ph:caret-right-bold" width="24" height="24" />
                </button>
              </>
            )}

            {/* Fullscreen Image Container */}
            <div className="certificates__lightbox-image-container">
              <img
                src={activeCert.imageUrl}
                alt={activeCert.title}
                className="certificates__lightbox-img"
              />
            </div>

            {/* Counter Badge */}
            {publishedCertificates.length > 1 && (
              <div className="certificates__lightbox-counter">
                {lightboxIndex + 1} / {publishedCertificates.length}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
