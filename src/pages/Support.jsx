import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { HelpCircle, Book, Mail, MessageCircle, ChevronDown, ChevronUp, Clock, CheckCircle, Inbox } from 'lucide-react';
import './Support.css';

const Support = () => {
  const { t } = useTranslation();
  const { token } = useSelector((state) => state.auth);
  const location = useLocation();
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [activeTab, setActiveTab] = useState('contact');
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    category: 'general',
  });
  const [sending, setSending] = useState(false);
  const [myMessages, setMyMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Handle navigation from notification
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    if (activeTab === 'my-messages') {
      fetchMyMessages();
    }
  }, [activeTab]);

  const fetchMyMessages = async () => {
    setLoadingMessages(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/messages/user`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setMyMessages(response.data.data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const faqs = [
    {
      id: 1,
      question: t('support.faqs.uploadDocs.question'),
      answer: t('support.faqs.uploadDocs.answer'),
    },
    {
      id: 2,
      question: t('support.faqs.encryption.question'),
      answer: t('support.faqs.encryption.answer'),
    },
    {
      id: 3,
      question: t('support.faqs.sharing.question'),
      answer: t('support.faqs.sharing.answer'),
    },
    {
      id: 4,
      question: t('support.faqs.recovery.question'),
      answer: t('support.faqs.recovery.answer'),
    },
    {
      id: 5,
      question: t('support.faqs.fileTypes.question'),
      answer: t('support.faqs.fileTypes.answer'),
    },
    {
      id: 6,
      question: t('support.faqs.twoFactor.question'),
      answer: t('support.faqs.twoFactor.answer'),
    },
    {
      id: 7,
      question: t('support.faqs.mobile.question'),
      answer: t('support.faqs.mobile.answer'),
    },
    {
      id: 8,
      question: t('support.faqs.cancellation.question'),
      answer: t('support.faqs.cancellation.answer'),
    },
  ];

  const tutorials = [
    { title: t('support.tutorials.gettingStarted.title'), duration: t('support.tutorials.gettingStarted.duration') },
    { title: t('support.tutorials.organization.title'), duration: t('support.tutorials.organization.duration') },
    { title: t('support.tutorials.collaboration.title'), duration: t('support.tutorials.collaboration.duration') },
    { title: t('support.tutorials.security.title'), duration: t('support.tutorials.security.duration') },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/messages`,
        contactForm,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      alert(t('support.successMessage'));
      setContactForm({ subject: '', message: '', category: 'general' });
      // Refresh messages if on my-messages tab
      if (activeTab === 'my-messages') {
        fetchMyMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { icon: <Clock size={14} />, class: 'status-pending', text: t('support.statusPending') },
      in_progress: { icon: <Clock size={14} />, class: 'status-progress', text: t('support.statusInProgress') },
      resolved: { icon: <CheckCircle size={14} />, class: 'status-resolved', text: t('support.statusResolved') },
      closed: { icon: <CheckCircle size={14} />, class: 'status-closed', text: t('support.statusClosed') }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`status-badge ${config.class}`}>
        {config.icon} {config.text}
      </span>
    );
  };

  return (
    <div className="support-page">
      <div className="support-header">
        <HelpCircle size={48} />
        <h1>{t('support.title')}</h1>
        <p className="subtitle">{t('support.subtitle')}</p>
      </div>

      <div className="support-tabs">
        <button
          className={`support-tab ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          <Mail size={18} /> {t('support.tabContact')}
        </button>
        <button
          className={`support-tab ${activeTab === 'my-messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-messages')}
        >
          <Inbox size={18} /> {t('support.tabMyMessages')}
        </button>
        <button
          className={`support-tab ${activeTab === 'faq' ? 'active' : ''}`}
          onClick={() => setActiveTab('faq')}
        >
          <Book size={18} /> {t('support.tabFAQ')}
        </button>
      </div>

      <div className="support-content">
        {activeTab === 'my-messages' && (
          <div className="support-section">
            <div className="section-header">
              <Inbox size={24} />
              <h2>{t('support.tabMyMessages')}</h2>
            </div>

            {loadingMessages ? (
              <div className="loading-messages">{t('support.loading')}</div>
            ) : myMessages.length === 0 ? (
              <div className="no-messages-found">
                <MessageCircle size={48} />
                <p>{t('support.noMessages')}</p>
                <button 
                  className="btn-primary"
                  onClick={() => setActiveTab('contact')}
                >
                  {t('support.sendAMessage')}
                </button>
              </div>
            ) : (
              <div className="messages-list-user">
                {myMessages.map((msg) => (
                  <div key={msg._id} className="user-message-card">
                    <div className="message-card-header">
                      <h3>{msg.subject}</h3>
                      {getStatusBadge(msg.status)}
                    </div>
                    <div className="message-card-meta">
                      <span className="message-date">{formatDate(msg.createdAt)}</span>
                      <span className="message-category">{msg.category.replace('_', ' ')}</span>
                    </div>
                    <div className="message-card-content">
                      <p><strong>{t('support.yourMessage')}:</strong></p>
                      <p>{msg.message}</p>
                    </div>
                    {msg.response && (
                      <div className="message-card-response">
                        <p><strong>{t('support.adminResponse')}:</strong></p>
                        <p>{msg.response}</p>
                        {msg.respondedAt && (
                          <small className="response-date">
                            {t('support.respondedOn')} {formatDate(msg.respondedAt)}
                          </small>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="support-section">
            <div className="section-header">
              <Book size={24} />
              <h2>{t('support.faqTitle')}</h2>
            </div>

            <div className="faq-list">
              {faqs.map(faq => (
                <div key={faq.id} className="faq-item">
                  <button
                    className="faq-question"
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  >
                    <span>{faq.question}</span>
                    {expandedFaq === faq.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="faq-answer">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <>
            <div className="support-section">
              <div className="section-header">
                <Book size={24} />
                <h2>{t('support.tutorialsTitle')}</h2>
              </div>

              <div className="tutorials-list">
                {tutorials.map((tutorial, index) => (
                  <div key={index} className="tutorial-item">
                    <Book size={18} />
                    <div>
                      <h3>{tutorial.title}</h3>
                      <span className="duration">{tutorial.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="support-section">
              <div className="section-header">
                <MessageCircle size={24} />
                <h2>{t('support.contactSupportTitle')}</h2>
              </div>

              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label>{t('support.subject')}</label>
                  <input
                    type="text"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    placeholder={t('support.subjectPlaceholder')}
                    required
                    disabled={sending}
                  />
                </div>

                <div className="form-group">
                  <label>{t('support.category')}</label>
                  <select
                    value={contactForm.category}
                    onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                    disabled={sending}
                  >
                    <option value="general">{t('support.categoryGeneral')}</option>
                    <option value="technical">{t('support.categoryTechnical')}</option>
                    <option value="billing">{t('support.categoryBilling')}</option>
                    <option value="feature_request">{t('support.categoryFeatureRequest')}</option>
                    <option value="bug_report">{t('support.categoryBugReport')}</option>
                    <option value="other">{t('support.categoryOther')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t('support.message')}</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder={t('support.messagePlaceholder')}
                    rows="6"
                    required
                    disabled={sending}
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={sending}>
                  <Mail size={20} />
                  {sending ? t('support.sending') : t('support.sendMessage')}
                </button>
              </form>

              <div className="contact-info">
                <p>{t('support.contactInfo')}</p>
                <a href="mailto:support@docarchive.com">support@docarchive.com</a>
                <p className="response-time">{t('support.responseTime')}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Support;
