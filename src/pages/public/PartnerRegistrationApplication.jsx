import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { Link } from 'react-router-dom';

export default function PartnerRegistrationApplication() {
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    registrationNumber: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    companyWebsite: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.createPendingPartner(formData);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-8 bg-white rounded-md shadow-sm border border-slate-200 text-center">
        <span className="material-symbols-outlined text-5xl text-emerald-500 mb-4">check_circle</span>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted Successfully</h2>
        <p className="text-slate-600 mb-6">
          Thank you for your interest in partnering with us. Our administrative team will review your application and contact you at <strong>{formData.contactEmail}</strong> with further instructions.
        </p>
        <Link to="/" className="btn-primary">Return to Homepage</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 p-8 bg-white rounded-md shadow-sm border border-slate-200">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Industry Partner Registration</h2>
        <p className="text-slate-600 mt-2">Fill out the form below to apply for a partner account. This will allow you to post vacancies and recruit talent directly from our alumni network.</p>
      </div>

      {error && <div className="p-3 mb-6 text-sm text-rose-700 bg-rose-50 border-l-4 border-rose-500 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="form-label">Company Name</label>
            <input type="text" name="companyName" required value={formData.companyName} onChange={handleChange} className="form-input" />
          </div>
          <div>
            <label className="form-label">Industry Sector</label>
            <select name="industry" required value={formData.industry} onChange={handleChange} className="form-input">
              <option value="">Select an industry...</option>
              <option value="IT">Information Technology</option>
              <option value="Finance">Finance & Banking</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="form-label">Business Registration Number</label>
            <input type="text" name="registrationNumber" required value={formData.registrationNumber} onChange={handleChange} className="form-input" />
          </div>
          <div>
            <label className="form-label">Company Website</label>
            <input type="url" name="companyWebsite" value={formData.companyWebsite} onChange={handleChange} className="form-input" placeholder="https://" />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Primary Contact Person</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Full Name</label>
              <input type="text" name="contactPerson" required value={formData.contactPerson} onChange={handleChange} className="form-input" />
            </div>
            <div>
              <label className="form-label">Contact Phone</label>
              <input type="tel" name="contactPhone" required value={formData.contactPhone} onChange={handleChange} className="form-input" />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Work Email</label>
              <input type="email" name="contactEmail" required value={formData.contactEmail} onChange={handleChange} className="form-input" />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-4">
          <Link to="/" className="btn-outline">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
}
