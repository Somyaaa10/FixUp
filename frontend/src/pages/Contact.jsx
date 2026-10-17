import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FiMail, FiSend, FiCheckCircle, FiUser, FiAlertCircle } from 'react-icons/fi';
import { BASE_URL } from '../config';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    hp: '', // spam honeypot field
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedSubject = formData.subject.trim();
    const trimmedMessage = formData.message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      const msg = 'Please fill out all required fields.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (trimmedName.length < 2) {
      const msg = 'Name must be at least 2 characters long.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (trimmedSubject.length < 3) {
      const msg = 'Subject must be at least 3 characters long.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (trimmedMessage.length < 10) {
      const msg = 'Message must be at least 10 characters long.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/v1/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          subject: trimmedSubject,
          message: trimmedMessage,
          hp: formData.hp,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit inquiry. Please try again.');
      }

      setSubmitted(true);
      toast.success(data.message || 'Your inquiry has been received successfully!');
    } catch (err) {
      // Preserve entered data so user does not lose input
      const fallbackMsg = err.message || 'Unable to connect to support service. Please try again.';
      setErrorMessage(fallbackMsg);
      toast.error(fallbackMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F7F7F6] min-h-screen">
      <section className="bg-[#F7F7F6] border-b border-[#EAE7E3] py-14">
        <div className="container text-center max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#AD7B5D] bg-[#AD7B5D]/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Support & Inquiries
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#202124]">
            Contact FixUp Support
          </h1>
          <p className="text-[#6B7280] text-xs sm:text-sm mt-2">
            Have questions about booking a professional, platform features, or trade partnerships? Reach out to our team.
          </p>
        </div>
      </section>

      <section className="py-14 bg-white">
        <div className="container max-w-2xl">
          {submitted ? (
            <div
              role="alert"
              aria-live="polite"
              className="bg-[#EFFBF5] border border-[#A7F3D0] rounded-3xl p-8 sm:p-10 text-center animate-in fade-in"
            >
              <FiCheckCircle className="w-12 h-12 text-[#27865B] mx-auto mb-3" />
              <h3 className="font-heading text-xl font-bold text-[#202124]">
                Message Received!
              </h3>
              <p className="text-xs sm:text-sm text-[#6B7280] mt-2 max-w-md mx-auto">
                Thank you, <strong>{formData.name}</strong>. Your message has been safely received. Our support team will review your inquiry and follow up at <strong>{formData.email}</strong> shortly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', subject: '', message: '', hp: '' });
                  setErrorMessage('');
                }}
                className="mt-6 inline-flex items-center gap-2 bg-white text-[#202124] font-heading text-xs font-semibold px-5 py-2.5 rounded-full border border-[#EAE7E3] hover:bg-gray-50 transition shadow-soft"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-[#EAE7E3] rounded-3xl p-6 sm:p-8 shadow-soft space-y-6"
            >
              {/* Spam Honeypot - hidden from human users */}
              <input
                type="text"
                name="hp"
                value={formData.hp}
                onChange={(e) => setFormData({ ...formData, hp: e.target.value })}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              {errorMessage && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2"
                >
                  <FiAlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label htmlFor="name" className="font-heading text-xs font-semibold uppercase tracking-wider text-[#202124] block mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7280]">
                    <FiUser className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    required
                    disabled={loading}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Doe"
                    maxLength={100}
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#202124] placeholder:text-[#6B7280]/60 border border-[#EAE7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AD7B5D]/20 focus:border-[#AD7B5D] transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="font-heading text-xs font-semibold uppercase tracking-wider text-[#202124] block mb-2">
                  Your Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7280]">
                    <FiMail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    required
                    disabled={loading}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    maxLength={150}
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#202124] placeholder:text-[#6B7280]/60 border border-[#EAE7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AD7B5D]/20 focus:border-[#AD7B5D] transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="font-heading text-xs font-semibold uppercase tracking-wider text-[#202124] block mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  required
                  disabled={loading}
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="How can we assist you?"
                  maxLength={200}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm text-[#202124] placeholder:text-[#6B7280]/60 border border-[#EAE7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AD7B5D]/20 focus:border-[#AD7B5D] transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="message" className="font-heading text-xs font-semibold uppercase tracking-wider text-[#202124] block mb-2">
                  Your Message
                </label>
                <div className="relative">
                  <textarea
                    rows="5"
                    id="message"
                    required
                    disabled={loading}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your inquiry or question in detail..."
                    maxLength={2000}
                    className="w-full px-4 py-3 text-xs sm:text-sm text-[#202124] placeholder:text-[#6B7280]/60 border border-[#EAE7E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AD7B5D]/20 focus:border-[#AD7B5D] transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="flex justify-end mt-1 text-[11px] text-[#6B7280]">
                  <span>{formData.message.length}/2000 characters</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#202124] hover:bg-black text-white font-heading font-medium text-xs sm:text-sm px-8 py-3 rounded-full shadow-soft transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send Message</span>
                    <FiSend className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default Contact;