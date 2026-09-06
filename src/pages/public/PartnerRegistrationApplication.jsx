import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';

const benefits = [
  {
    icon: 'school',
    title: 'Top Undergraduates & Graduates',
    desc: 'Direct access to pre-screened talent across Computing, Business, and Engineering faculties.'
  },
  {
    icon: 'auto_awesome',
    title: 'Smart AI Candidate Search',
    desc: 'Utilize natural language semantic search to match candidate skillsets with your exact job specs.'
  },
  {
    icon: 'verified',
    title: 'Verified Digital Credentials',
    desc: 'Instantly verify academic performance, project transcripts, and certified technical badges.'
  },
  {
    icon: 'calendar_month',
    title: 'Recruitment Drives & Workshops',
    desc: 'Host guest sessions, tech meetups, and on-campus interview drives with university support.'
  }
];

import { validateEmail } from '../../utils/validation';

export default function PartnerRegistrationApplication() {
  const [formData, setFormData] = useState({
    companyName: '',
    companyIndustry: 'IT & Software',
    companyAddress: '',
    companyDescription: '',
    representativeFullName: '',
    representativeJobRole: '',
    email: '',
    phone: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(formData.email)) {
      setError('Please provide a valid official corporate email address (e.g. careers@company.com).');
      return;
    }

    setLoading(true);

    try {
      await authService.createPendingPartner(formData);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to submit application at this time. Please check the details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <span className="material-symbols-outlined text-[44px]">task_alt</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Application Submitted Successfully!</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto">
          Thank you for applying to partner with NSBM Green University. Our Industry Interaction Cell and Faculty Management will review your submission and contact you at <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formData.email}</span> within 2–3 business days with account setup instructions.
        </p>
        <div className="pt-4 flex flex-wrap justify-center gap-4">
          <Link to="/">
            <Button>Return to Home</Button>
          </Link>
          <Link to="/collaborators">
            <Button variant="outline">View Corporate Directory</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Column: Visual Side Image & Institutional Perks */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          
          {/* Main Visual Image Banner */}
          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 group">
            <img
              src="/images/partner-collaboration.jpg"
              alt="NSBM Industry Partnership Collaboration"
              className="w-full h-72 sm:h-80 object-cover transform group-hover:scale-105 transition-transform duration-700"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/event-career.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/90 backdrop-blur-sm text-[10px] font-bold tracking-wider uppercase">
                <span className="material-symbols-outlined text-[14px]">handshake</span>
                Corporate Network
              </div>
              <h2 className="text-xl font-bold text-white leading-snug">
                Partner with Sri Lanka's Premier University Town
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect with 10,000+ students and alumni for high-impact internship placements.
              </p>
            </div>
          </div>

          {/* Key Partnership Pillars */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Partnership Privileges
            </h3>
            
            <div className="space-y-3.5">
              {benefits.map((b) => (
                <div key={b.title} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100 dark:border-emerald-800/40">
                    <span className="material-symbols-outlined text-[18px]">{b.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{b.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span>Official MoU Gateway</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">NIC Unit • NSBM</span>
            </div>
          </div>

        </div>

        {/* Right Column: Multi-section Registration Form */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Header Title */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-semibold">
              <span className="material-symbols-outlined text-sm">app_registration</span>
              Employer Onboarding Application
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Become an Industry Partner</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Submit your organization details below. Our faculty coordination unit will review your submission and provision your corporate recruitment portal credentials.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section 1: Company Information */}
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/60 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">corporate_fare</span>
                  <CardTitle className="text-base font-bold">1. Corporate & Organization Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Company / Organization Name"
                    name="companyName"
                    placeholder="e.g. Virtusa Lanka (Pvt) Ltd"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                  <Select
                    label="Primary Industry Sector"
                    name="companyIndustry"
                    value={formData.companyIndustry}
                    onChange={handleChange}
                    required
                  >
                    <option value="IT & Software">IT & Software Engineering</option>
                    <option value="Banking & Finance">Banking, Finance & Fintech</option>
                    <option value="Telecommunications">Telecommunications & Networks</option>
                    <option value="Manufacturing & Logistics">Manufacturing & Logistics</option>
                    <option value="Media & Creative">Media, UI/UX & Design</option>
                    <option value="Healthcare & BioSciences">Healthcare & BioSciences</option>
                    <option value="Consulting & Audit">Consulting, Audit & Advisory</option>
                  </Select>
                </div>

                <Input
                  label="Headquarters / Registered Office Address"
                  name="companyAddress"
                  placeholder="e.g. No. 120, Galle Road, Colombo 03"
                  value={formData.companyAddress}
                  onChange={handleChange}
                  required
                />

                <Textarea
                  label="Company Overview & Recruitment Focus"
                  name="companyDescription"
                  rows={3}
                  placeholder="Briefly describe your company, core technology stack, and typical internship or graduate trainee roles..."
                  value={formData.companyDescription}
                  onChange={handleChange}
                  required
                />
              </CardContent>
            </Card>

            {/* Section 2: Authorized Representative */}
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/60 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">badge</span>
                  <CardTitle className="text-base font-bold">2. Authorized Representative</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    name="representativeFullName"
                    placeholder="e.g. Samantha Fernando"
                    value={formData.representativeFullName}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="Job Designation / Role"
                    name="representativeJobRole"
                    placeholder="e.g. Talent Acquisition Lead"
                    value={formData.representativeJobRole}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="Official Corporate Email"
                    name="email"
                    type="email"
                    placeholder="samantha.f@virtusa.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="Contact Phone Number"
                    name="phone"
                    placeholder="+94 11 234 5678"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <p className="text-xs text-slate-500">
                By submitting, you agree to NSBM Industry Portal placement terms.
              </p>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link to="/" className="w-1/2 sm:w-auto">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" loading={loading} icon="send" className="w-1/2 sm:w-auto px-6">
                  Submit Application
                </Button>
              </div>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
}
