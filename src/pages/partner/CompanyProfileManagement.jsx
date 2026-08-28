import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

export default function CompanyProfileManagement() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    companyName: user?.username || '',
    industry: 'IT',
    description: '',
    website: '',
    companySize: '',
    contactName: '',
    designation: '',
    email: user?.email || '',
    phone: '',
  });

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await authService.getPartnerProfile();
        const data = profileRes.data;
        setFormData({
          companyName: data.companyName || '',
          industry: data.companyIndustry || 'IT',
          description: data.companyDescription || '',
          website: data.website || '',
          companySize: data.companySize || '',
          contactName: data.representativeFullName || '',
          designation: data.representativeJobRole || '',
          email: data.email || '',
          phone: data.phone || '',
        });
      } catch (error) {
        console.error("Failed to load profile data:", error);
      }
    };
    fetchData();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');

    // In a real app we'd call an update endpoint here
    setTimeout(() => {
      setSaving(false);
      setSavedMsg('Company profile details successfully updated.');
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Organization Profile</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Manage your company branding, representative details, and public directory listing.
        </p>
      </div>

      {savedMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          {savedMsg}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-24 h-24 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center mx-auto overflow-hidden">
                  <span className="material-symbols-outlined text-[48px] text-slate-400">business</span>
                </div>
                <Button variant="outline" size="sm" icon="upload" type="button" className="w-full justify-center">Upload Corporate Logo</Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Company Name" 
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required 
                  />
                  <Select 
                    label="Primary Sector"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  >
                    <option value="IT">Information Technology & Software</option>
                    <option value="FINANCE">Finance, Banking & Fintech</option>
                    <option value="TELECOM">Telecommunications & Networks</option>
                    <option value="MANUFACTURING">Manufacturing & Engineering</option>
                  </Select>
                  <div className="md:col-span-2">
                    <Textarea 
                      label="Company Description" 
                      rows={3} 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required 
                    />
                  </div>
                  <Input 
                    label="Website URL" 
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                  <Input 
                    label="Company Size" 
                    value={formData.companySize}
                    onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Authorized Representative</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Primary Contact Name" 
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    required 
                  />
                  <Input 
                    label="Designation / Role" 
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    required 
                  />
                  <Input 
                    label="Corporate Email Address" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required 
                  />
                  <Input 
                    label="Contact Phone" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required 
                  />
                </div>
                <div className="pt-2 flex justify-end">
                  <Button type="submit" loading={saving} icon="save">
                    Save Profile Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
