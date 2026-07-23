import { useState, useEffect, useMemo, FormEvent } from 'react';
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Icon } from '@iconify/react';

import { db } from '../config/firebase';
import type { Certificate } from '../types';

import './CertificatesManager.scss';

export default function CertificatesManager() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoadingCertificates, setIsLoadingCertificates] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Published' | 'Draft'>('All');
  const [sortOrder, setSortOrder] = useState<'Newest' | 'Oldest'>('Newest');

  // Operation States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState<number | string>(1);
  const [formStatus, setFormStatus] = useState<'Published' | 'Draft'>('Published');
  const [formError, setFormError] = useState('');

  // Delete Confirmation State
  const [deletingCert, setDeletingCert] = useState<Certificate | null>(null);

  // Toast / Feedback message
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | ''>('');

  const showFeedback = (msg: string, type: 'success' | 'error') => {
    setFeedbackMessage(msg);
    setFeedbackType(type);
    setTimeout(() => {
      setFeedbackType('');
    }, 3500);
  };

  // Load certificates from Firestore
  const fetchCertificates = async () => {
    setIsLoadingCertificates(true);
    try {
      const snap = await getDocs(collection(db, 'certificates'));
      const fetched: Certificate[] = snap.docs.map((docSnap) => {
        const data = docSnap.data();
        const rawStatus = (data.status || 'published').toString().toLowerCase();
        return {
          id: docSnap.id,
          title: data.title || '',
          imageUrl: data.imageUrl || '',
          displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : parseInt(data.displayOrder, 10) || 1,
          status: rawStatus === 'draft' ? 'Draft' : 'Published',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
      });

      // Sort displayOrder ASC by default from Firestore load
      fetched.sort((a, b) => a.displayOrder - b.displayOrder);
      setCertificates(fetched);
    } catch (err) {
      console.error('Error fetching certificates from Firestore:', err);
      showFeedback('Failed to load certificates from Firestore.', 'error');
    } finally {
      setIsLoadingCertificates(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  // Filtered & Sorted certificates
  const filteredCertificates = useMemo(() => {
    return certificates
      .filter((cert) => {
        const matchesSearch = cert.title.toLowerCase().includes(searchQuery.toLowerCase().trim());
        const matchesStatus = statusFilter === 'All' ? true : cert.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        if (sortOrder === 'Newest') {
          return timeB - timeA;
        }
        return timeA - timeB;
      });
  }, [certificates, searchQuery, statusFilter, sortOrder]);

  const handleOpenAddModal = () => {
    setEditingCert(null);
    setFormTitle('');
    setFormImageUrl('');
    const nextOrder = certificates.length > 0 ? Math.max(...certificates.map((c) => c.displayOrder)) + 1 : 1;
    setFormDisplayOrder(nextOrder);
    setFormStatus('Published');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cert: Certificate) => {
    setEditingCert(cert);
    setFormTitle(cert.title);
    setFormImageUrl(cert.imageUrl || '');
    setFormDisplayOrder(cert.displayOrder);
    setFormStatus(cert.status === 'draft' || cert.status === 'Draft' ? 'Draft' : 'Published');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingCert(null);
    setFormTitle('');
    setFormImageUrl('');
    setFormError('');
  };

  const validateForm = (): boolean => {
    if (!formTitle.trim()) {
      setFormError('Certificate Title is required.');
      return false;
    }

    if (!formImageUrl.trim()) {
      setFormError('Image URL is required.');
      return false;
    }

    try {
      const parsedUrl = new URL(formImageUrl.trim());
      if (parsedUrl.protocol !== 'https:') {
        setFormError('Image URL should be a valid HTTPS URL.');
        return false;
      }
    } catch {
      setFormError('Image URL should be a valid HTTPS URL.');
      return false;
    }

    const orderNum = Number(formDisplayOrder);
    if (isNaN(orderNum) || formDisplayOrder === '') {
      setFormError('Display Order should be numeric.');
      return false;
    }

    return true;
  };

  const handleSaveCertificate = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormError('');

    const orderNum = typeof formDisplayOrder === 'number' ? formDisplayOrder : parseInt(formDisplayOrder, 10) || 1;
    const nowIso = new Date().toISOString();
    const docData = {
      title: formTitle.trim(),
      imageUrl: formImageUrl.trim(),
      displayOrder: orderNum,
      status: formStatus.toLowerCase(),
      updatedAt: nowIso,
    };

    try {
      if (editingCert && editingCert.id) {
        // UPDATE existing document in Firestore
        const docRef = doc(db, 'certificates', editingCert.id);
        await setDoc(
          docRef,
          {
            ...docData,
            createdAt: editingCert.createdAt || nowIso,
          },
          { merge: true }
        );

        showFeedback('Certificate Updated Successfully', 'success');
      } else {
        // CREATE new document in Firestore
        await addDoc(collection(db, 'certificates'), {
          ...docData,
          createdAt: nowIso,
        });

        showFeedback('Certificate Added Successfully', 'success');
      }

      await fetchCertificates();
      handleCloseModal();
    } catch (err) {
      console.error('Firestore save error:', err);
      setFormError('Failed to save certificate to Firestore. Please try again.');
      showFeedback('Failed to save certificate.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (cert: Certificate) => {
    setDeletingCert(cert);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCert || !deletingCert.id) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'certificates', deletingCert.id));
      showFeedback('Certificate Deleted Successfully', 'success');
      setDeletingCert(null);
      await fetchCertificates();
    } catch (err) {
      console.error('Firestore delete error:', err);
      showFeedback('Failed to delete certificate from Firestore.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setDeletingCert(null);
  };

  const isValidFormImageUrl = useMemo(() => {
    if (!formImageUrl.trim()) return false;
    try {
      const u = new URL(formImageUrl.trim());
      return u.protocol === 'https:';
    } catch {
      return false;
    }
  }, [formImageUrl]);

  return (
    <div className="certificates-manager">
      {/* Toast Notification */}
      <div
        className={`certificates-manager__toast ${
          feedbackType ? `certificates-manager__toast--show certificates-manager__toast--${feedbackType}` : ''
        }`}
      >
        {feedbackType === 'success' && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        )}
        {feedbackType === 'error' && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
        <span>{feedbackMessage}</span>
      </div>

      {/* Header Bar with Action Button */}
      <div className="certificates-manager__header-bar">
        <div className="certificates-manager__title-group">
          <h2 className="certificates-manager__page-title">Certificates</h2>
          <p className="certificates-manager__page-sub">
            Manage your professional certifications, credentials, and achievements.
          </p>
        </div>
        <button
          type="button"
          className="certificates-manager__add-btn"
          onClick={handleOpenAddModal}
          disabled={isLoadingCertificates || isSubmitting || isDeleting}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Certificate
        </button>
      </div>

      {/* Controls Bar: Search, Filter, Sort */}
      <div className="certificates-manager__controls">
        <div className="certificates-manager__search-box">
          <svg className="certificates-manager__search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="certificates-manager__search-input"
            placeholder="Search certificates by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="certificates-manager__clear-search"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div className="certificates-manager__dropdowns">
          <div className="certificates-manager__select-group">
            <label htmlFor="status-filter" className="certificates-manager__select-label">
              Status
            </label>
            <div className="certificates-manager__select-wrapper">
              <select
                id="status-filter"
                className="certificates-manager__select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Published' | 'Draft')}
              >
                <option value="All">All</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
              <svg className="certificates-manager__select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          <div className="certificates-manager__select-group">
            <label htmlFor="sort-order" className="certificates-manager__select-label">
              Sort
            </label>
            <div className="certificates-manager__select-wrapper">
              <select
                id="sort-order"
                className="certificates-manager__select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'Newest' | 'Oldest')}
              >
                <option value="Newest">Newest</option>
                <option value="Oldest">Oldest</option>
              </select>
              <svg className="certificates-manager__select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoadingCertificates ? (
        <div className="certificates-manager__loading">
          <span className="certificates-manager__spinner" />
          <span>Loading certificates...</span>
        </div>
      ) : filteredCertificates.length === 0 ? (
        /* Empty State */
        <div className="certificates-manager__empty">
          <div className="certificates-manager__empty-icon" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="7" />
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
            </svg>
          </div>
          <h3 className="certificates-manager__empty-title">No certificates available.</h3>
          <p className="certificates-manager__empty-text">
            {searchQuery || statusFilter !== 'All'
              ? 'Try adjusting your search query or status filter.'
              : 'Click "+ Add Certificate" above to create your first certificate.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="certificates-manager__table-container">
            <table className="certificates-manager__table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '100px' }}>Thumbnail</th>
                  <th scope="col">Title</th>
                  <th scope="col" style={{ width: '120px' }}>Status</th>
                  <th scope="col" style={{ width: '130px' }}>Display Order</th>
                  <th scope="col" style={{ width: '150px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCertificates.map((cert) => (
                  <tr key={cert.id}>
                    <td>
                      <div className="certificates-manager__thumbnail-wrapper">
                        {cert.imageUrl ? (
                          <img
                            src={cert.imageUrl}
                            alt={cert.title}
                            className="certificates-manager__thumbnail-img"
                            onError={(e) => {
                              // Fallback on broken URL
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="certificates-manager__thumbnail-placeholder">
                            <Icon icon="mdi:certificate-outline" width="24" height="24" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="certificates-manager__cert-title">{cert.title}</span>
                    </td>
                    <td>
                      <span
                        className={`certificates-manager__status-badge certificates-manager__status-badge--${cert.status.toLowerCase()}`}
                      >
                        <span className="certificates-manager__status-dot" />
                        {cert.status}
                      </span>
                    </td>
                    <td>
                      <span className="certificates-manager__order-tag">#{cert.displayOrder}</span>
                    </td>
                    <td>
                      <div className="certificates-manager__actions">
                        <button
                          type="button"
                          className="certificates-manager__action-btn certificates-manager__action-btn--edit"
                          onClick={() => handleOpenEditModal(cert)}
                          disabled={isSubmitting || isDeleting}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="certificates-manager__action-btn certificates-manager__action-btn--delete"
                          onClick={() => handleDeleteClick(cert)}
                          disabled={isSubmitting || isDeleting}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cards View */}
          <div className="certificates-manager__mobile-grid">
            {filteredCertificates.map((cert) => (
              <div key={cert.id} className="certificates-manager__mobile-card">
                <div className="certificates-manager__mobile-card-top">
                  <div className="certificates-manager__thumbnail-wrapper">
                    {cert.imageUrl ? (
                      <img
                        src={cert.imageUrl}
                        alt={cert.title}
                        className="certificates-manager__thumbnail-img"
                      />
                    ) : (
                      <div className="certificates-manager__thumbnail-placeholder">
                        <Icon icon="mdi:certificate-outline" width="24" height="24" />
                      </div>
                    )}
                  </div>
                  <div className="certificates-manager__mobile-card-info">
                    <span
                      className={`certificates-manager__status-badge certificates-manager__status-badge--${cert.status.toLowerCase()}`}
                    >
                      <span className="certificates-manager__status-dot" />
                      {cert.status}
                    </span>
                    <h4 className="certificates-manager__mobile-card-title">{cert.title}</h4>
                    <span className="certificates-manager__order-tag">Display Order: #{cert.displayOrder}</span>
                  </div>
                </div>
                <div className="certificates-manager__mobile-card-actions">
                  <button
                    type="button"
                    className="certificates-manager__action-btn certificates-manager__action-btn--edit"
                    onClick={() => handleOpenEditModal(cert)}
                    disabled={isSubmitting || isDeleting}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="certificates-manager__action-btn certificates-manager__action-btn--delete"
                    onClick={() => handleDeleteClick(cert)}
                    disabled={isSubmitting || isDeleting}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add / Edit Certificate Modal */}
      {isModalOpen && (
        <div className="certificates-manager__modal-overlay" onClick={handleCloseModal}>
          <div
            className="certificates-manager__modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="cert-modal-title"
          >
            <div className="certificates-manager__modal-header">
              <h3 id="cert-modal-title" className="certificates-manager__modal-title">
                {editingCert ? 'Edit Certificate' : 'Add Certificate'}
              </h3>
              <button
                type="button"
                className="certificates-manager__modal-close"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                aria-label="Close modal"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveCertificate} className="certificates-manager__modal-form">
              {formError && <div className="certificates-manager__form-error">{formError}</div>}

              {/* Certificate Title */}
              <div className="certificates-manager__form-group">
                <label htmlFor="cert-title">
                  Certificate Title <span className="certificates-manager__required">*</span>
                </label>
                <input
                  id="cert-title"
                  type="text"
                  className="certificates-manager__input"
                  placeholder="e.g. AWS Certified Solutions Architect"
                  value={formTitle}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    if (formError) setFormError('');
                  }}
                />
              </div>

              {/* Certificate Image URL */}
              <div className="certificates-manager__form-group">
                <label htmlFor="cert-image-url">
                  Certificate Image URL <span className="certificates-manager__required">*</span>
                </label>
                <input
                  id="cert-image-url"
                  type="url"
                  className="certificates-manager__input"
                  placeholder="https://res.cloudinary.com/..."
                  value={formImageUrl}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setFormImageUrl(e.target.value);
                    if (formError) setFormError('');
                  }}
                />
                <small className="certificates-manager__field-hint">
                  Upload your certificate image to Cloudinary and paste the generated image URL here.
                </small>

                {isValidFormImageUrl && (
                  <div className="certificates-manager__image-preview-container">
                    <span className="certificates-manager__preview-label">Live Image Preview:</span>
                    <img
                      src={formImageUrl.trim()}
                      alt="Certificate Preview"
                      className="certificates-manager__image-preview"
                    />
                  </div>
                )}
              </div>

              {/* Display Order & Status Row */}
              <div className="certificates-manager__form-row">
                <div className="certificates-manager__form-group">
                  <label htmlFor="cert-order">Display Order</label>
                  <input
                    id="cert-order"
                    type="number"
                    min="1"
                    className="certificates-manager__input"
                    value={formDisplayOrder}
                    disabled={isSubmitting}
                    onChange={(e) => setFormDisplayOrder(e.target.value)}
                  />
                </div>

                <div className="certificates-manager__form-group">
                  <label htmlFor="cert-status">Status</label>
                  <div className="certificates-manager__select-wrapper">
                    <select
                      id="cert-status"
                      className="certificates-manager__select"
                      value={formStatus}
                      disabled={isSubmitting}
                      onChange={(e) => setFormStatus(e.target.value as 'Published' | 'Draft')}
                    >
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                    </select>
                    <svg className="certificates-manager__select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="certificates-manager__modal-actions">
                <button
                  type="button"
                  className="certificates-manager__btn certificates-manager__btn--cancel"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="certificates-manager__btn certificates-manager__btn--save"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="certificates-manager__spinner" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCert && (
        <div className="certificates-manager__modal-overlay" onClick={handleCancelDelete}>
          <div
            className="certificates-manager__modal certificates-manager__modal--delete"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="delete-modal-title"
          >
            <div className="certificates-manager__modal-header">
              <h3 id="delete-modal-title" className="certificates-manager__modal-title">
                Confirm Delete
              </h3>
              <button
                type="button"
                className="certificates-manager__modal-close"
                onClick={handleCancelDelete}
                disabled={isDeleting}
                aria-label="Close delete dialog"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="certificates-manager__delete-body">
              <p className="certificates-manager__delete-message">
                Are you sure you want to delete <strong>&ldquo;{deletingCert.title}&rdquo;</strong>?
              </p>
              <p className="certificates-manager__delete-note">
                This action will delete the document from Firestore.
              </p>
            </div>
            <div className="certificates-manager__modal-actions">
              <button
                type="button"
                className="certificates-manager__btn certificates-manager__btn--cancel"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="certificates-manager__btn certificates-manager__btn--danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="certificates-manager__spinner" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
