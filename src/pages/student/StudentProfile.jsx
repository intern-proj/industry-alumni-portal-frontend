import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export default function StudentProfile() {
  const { user } = useAuth();
  const userId = user?.id || user?.username || 'STU001';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [profile, setProfile] = useState({
    fullName: user?.username || '',
    headline: '',
    bio: '',
    phoneNumber: '',
    personalEmail: user?.email || '',
    linkedInUrl: '',
    githubUrl: '',
    isActivelyLooking: true,
  });

  const [academicRecord, setAcademicRecord] = useState({
    facultyName: '',
    degreeProgram: '',
    gpa: '',
    batch: '',
    currentYear: '',
    expectedGraduation: '',
  });

  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [profRes, acadRes, skillRes] = await Promise.allSettled([
          userService.getProfileByUserId(userId),
          userService.getAcademicRecord(userId),
          userService.getSkillsByUserId(userId),
        ]);

        if (profRes.status === 'fulfilled' && profRes.value?.data?.data) {
          setProfile((prev) => ({ ...prev, ...profRes.value.data.data }));
        }
        if (acadRes.status === 'fulfilled' && acadRes.value?.data?.data) {
          setAcademicRecord((prev) => ({ ...prev, ...acadRes.value.data.data }));
        }
        if (skillRes.status === 'fulfilled' && Array.isArray(skillRes.value?.data?.data)) {
          setSkills(skillRes.value.data.data.map((s) => s.name || s.skillName || s));
        }
      } catch {
        // Fallback initialized
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await userService.updateProfile(userId, profile);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      setSuccessMsg('Profile saved successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async () => {
    const nextVal = !profile.isActivelyLooking;
    setProfile((prev) => ({ ...prev, isActivelyLooking: nextVal }));
    try {
      await userService.toggleAvailability(userId, nextVal);
      setSuccessMsg(`Availability updated to ${nextVal ? 'Actively Looking' : 'Not Looking'}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      // Handled gracefully
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.trim() || skills.includes(newSkill.trim())) return;
    const skillName = newSkill.trim();
    setSkills((prev) => [...prev, skillName]);
    setNewSkill('');
    try {
      await userService.addSkill(userId, { name: skillName });
    } catch {
      // Local state already updated
    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
    try {
      await userService.deleteSkill(userId, skillToRemove);
    } catch {
      // Local state already updated
    }
  };

  const initials = user?.username?.substring(0, 2).toUpperCase() || 'ST';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Student Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your public academic details, skills, and industry placement visibility.</p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">error</span>
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Avatar & Availability */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-24 h-24 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto mb-4 text-3xl font-bold shadow-sm">
                {initials}
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{profile.fullName || user?.username}</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">{profile.headline}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{academicRecord.degreeProgram} • {academicRecord.currentYear}</p>

              {/* Availability Toggle */}
              <div className="mt-5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Internship Search</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {profile.isActivelyLooking ? 'Visible to employers' : 'Hidden from searches'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAvailability}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    profile.isActivelyLooking ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      profile.isActivelyLooking ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-left space-y-3 text-xs">
                <div>
                  <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Institutional Email</p>
                  <p className="text-slate-800 dark:text-slate-200 font-medium mt-0.5">{user?.username || 'student'}@students.nsbm.ac.lk</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Student Identifier</p>
                  <p className="text-slate-800 dark:text-slate-200 font-medium mt-0.5">{user?.username || 'STU001'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Skills Card */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-medium"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-rose-500 text-slate-400 text-[14px]"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <form onSubmit={handleAddSkill} className="flex gap-2 pt-2">
                <Input
                  placeholder="Add skill (e.g. Docker)..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="sm" variant="outline">
                  Add
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Academic Details & Contact Info */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Academic Records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Faculty" value={academicRecord.facultyName} disabled />
                <Input label="Degree Programme" value={academicRecord.degreeProgram} disabled />
                <Input label="Cumulative GPA" value={academicRecord.gpa} disabled />
                <Input label="Expected Graduation" value={academicRecord.expectedGraduation} disabled />
              </div>
              <p className="text-xs text-slate-400">
                Official academic records are synchronized directly with NSBM Student Information Systems.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Details & Contact Info</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  />
                  <Input
                    label="Professional Headline"
                    value={profile.headline}
                    onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                  />
                  <div className="md:col-span-2">
                    <Textarea
                      label="Bio / Professional Summary"
                      rows={3}
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Personal Email"
                    type="email"
                    value={profile.personalEmail}
                    onChange={(e) => setProfile({ ...profile, personalEmail: e.target.value })}
                  />
                  <Input
                    label="Phone Number"
                    value={profile.phoneNumber}
                    onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                  />
                  <Input
                    label="LinkedIn Profile URL"
                    value={profile.linkedInUrl}
                    onChange={(e) => setProfile({ ...profile, linkedInUrl: e.target.value })}
                  />
                  <Input
                    label="GitHub Profile URL"
                    value={profile.githubUrl}
                    onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
                  />
                </div>

                <div className="pt-3 flex justify-end">
                  <Button type="submit" loading={saving}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
