import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { storageService } from '../../services/storageService';
import { aiService } from '../../services/aiService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export default function StudentProfile() {
  const { user, updateUser } = useAuth();
  const userId = user?.username || user?.id || 'student';
  const avatarInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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
    profilePicUrl: '',
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
  const [projects, setProjects] = useState([]);
  const [enhancing, setEnhancing] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [profRes, acadRes, skillRes] = await Promise.allSettled([
          userService.getProfileByUserId(userId),
          userService.getAcademicRecord(userId),
          userService.getSkillsByUserId(userId),
        ]);

        let hasProjects = false;
        let loadedProfile = null;

        if (profRes.status === 'fulfilled' && profRes.value?.data?.data) {
          const p = profRes.value.data.data;
          loadedProfile = p;
          const sanitizedLastName = (p.lastName && p.lastName.trim().toLowerCase() !== 'candidate') ? p.lastName.trim() : '';
          const fullNameResolved = (p.fullName && p.fullName.trim()) 
            ? p.fullName.replace(/\s+Candidate$/i, '').trim() 
            : (p.firstName ? `${p.firstName} ${sanitizedLastName}`.trim() : (user?.username || ''));

          setProfile((prev) => ({
            ...prev,
            ...p,
            fullName: fullNameResolved,
            personalEmail: p.email || p.personalEmail || user?.email || '',
            phoneNumber: p.phone || p.phoneNumber || '',
            profilePicUrl: p.profilePicUrl || '',
          }));
          setAvatarImgError(false);

          if (updateUser && p.profilePicUrl) {
            updateUser({ profilePicUrl: p.profilePicUrl, picture: p.profilePicUrl });
          }

          let initialProjects = [];
          if (p.projects) {
            try {
              initialProjects = typeof p.projects === 'string' ? JSON.parse(p.projects) : p.projects;
            } catch {
              initialProjects = [];
            }
          }
          const validProjects = Array.isArray(initialProjects) ? initialProjects : [];
          setProjects(validProjects);
          if (validProjects.length > 0) {
            hasProjects = true;
          }
        }
        if (acadRes.status === 'fulfilled' && acadRes.value?.data?.data) {
          setAcademicRecord((prev) => ({ ...prev, ...acadRes.value.data.data }));
        }
        if (skillRes.status === 'fulfilled' && Array.isArray(skillRes.value?.data?.data)) {
          const rawSkills = skillRes.value.data.data.map((s) => s.name || s.skillName || s).filter(Boolean);
          setSkills(Array.from(new Set(rawSkills)));
        }

        // Automatic Profile Enhancement if student has a primary resume but no projects saved yet
        if (!hasProjects) {
          try {
            const resRes = await userService.getResumesByUserId(userId);
            const resList = resRes.data?.data || resRes.data || [];
            const primaryResume = resList.find((r) => r.isPrimary) || resList[0];
            if (primaryResume?.fileUrl && primaryResume.fileUrl.startsWith('http')) {
              triggerAutoEnhance(primaryResume, loadedProfile);
            }
          } catch (e) {
            console.warn('Auto profile enhancement check deferred:', e);
          }
        }
      } catch {
        // Fallback initialized
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId, user?.username, user?.email]);

  const parseFullName = (nameStr) => {
    const raw = (nameStr || '').trim().replace(/\s+Candidate$/i, '');
    if (!raw) {
      return { firstName: user?.username || 'Student', lastName: '' };
    }
    const parts = raw.split(/\s+/);
    const firstName = parts[0] || user?.username || 'Student';
    const lastName = parts.slice(1).join(' ') || '';
    return { firstName, lastName };
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP, SVG).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image file size must be 5MB or less.');
      return;
    }

    setUploadingAvatar(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const uploadRes = await storageService.uploadFile(file, {
        uploaderId: userId,
        fileType: 'OTHER',
      });

      const fileId = uploadRes.data?.fileId;
      const downloadUrl = fileId
        ? `http://localhost:8080/api/v1/storage/download/${fileId}?inline=true`
        : uploadRes.data?.storageUrl;

      if (!downloadUrl) {
        throw new Error('Upload succeeded but no download URL returned.');
      }

      setProfile((prev) => ({ ...prev, profilePicUrl: downloadUrl }));
      setAvatarImgError(false);

      // Persist directly to user-profile backend
      const { firstName, lastName } = parseFullName(profile.fullName || user?.username || 'Student');
      const email = profile.personalEmail || user?.email || 'student@students.nsbm.ac.lk';

      await userService.updateProfile(userId, {
        userId,
        firstName,
        lastName,
        email,
        phone: profile.phoneNumber || '',
        bio: profile.bio || profile.headline || '',
        profilePicUrl: downloadUrl,
        isActivelyLooking: profile.isActivelyLooking ?? true,
        projects: typeof projects === 'string' ? projects : JSON.stringify(projects || []),
      });

      if (updateUser) {
        updateUser({ profilePicUrl: downloadUrl, picture: downloadUrl });
      }

      setSuccessMsg('Profile picture uploaded and saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to upload profile picture:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to upload profile picture. Please try again.');
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setProfile((prev) => ({ ...prev, profilePicUrl: '' }));
    setAvatarImgError(false);
    try {
      const { firstName, lastName } = parseFullName(profile.fullName || user?.username || 'Student');
      const email = profile.personalEmail || user?.email || 'student@students.nsbm.ac.lk';

      await userService.updateProfile(userId, {
        userId,
        firstName,
        lastName,
        email,
        phone: profile.phoneNumber || '',
        bio: profile.bio || profile.headline || '',
        profilePicUrl: null,
        isActivelyLooking: profile.isActivelyLooking ?? true,
        projects: typeof projects === 'string' ? projects : JSON.stringify(projects || []),
      });

      if (updateUser) {
        updateUser({ profilePicUrl: null, picture: null });
      }
      setSuccessMsg('Profile picture removed.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.warn('Remove avatar error:', err);
    }
  };

  const triggerAutoEnhance = async (primaryResume, currentProfile) => {
    try {
      const aiRes = await aiService.enhanceProfileFromResume(userId, primaryResume.fileUrl, skills);
      const data = aiRes.data;
      if (data && data.status === 'success') {
        const newProjects = Array.isArray(data.projects) ? data.projects : [];
        const incomingSkills = Array.isArray(data.skills) ? data.skills : [];
        if (newProjects.length > 0 || incomingSkills.length > 0 || data.bio) {
          setProjects(newProjects);
          if (data.bio) {
            setProfile((prev) => ({ ...prev, bio: data.bio }));
          }
          if (incomingSkills.length > 0) {
            setSkills((prev) => Array.from(new Set([...prev, ...incomingSkills])));
          }

          const { firstName, lastName } = parseFullName(
            currentProfile?.fullName || currentProfile?.firstName
              ? `${currentProfile.firstName || ''} ${currentProfile.lastName || ''}`.trim()
              : (user?.username || 'Student')
          );

          await userService.updateProfile(userId, {
            userId,
            firstName,
            lastName,
            email: currentProfile?.email || currentProfile?.personalEmail || user?.email || 'student@students.nsbm.ac.lk',
            phone: currentProfile?.phone || currentProfile?.phoneNumber || '',
            bio: data.bio || currentProfile?.bio || '',
            projects: JSON.stringify(newProjects),
            profilePicUrl: currentProfile?.profilePicUrl || null,
            isActivelyLooking: currentProfile?.isActivelyLooking ?? true,
          });

          for (const sk of incomingSkills) {
            try {
              await userService.addSkill(userId, {
                skillName: sk,
                skillLevel: 'ADVANCED',
                category: 'TECHNICAL',
              });
            } catch {
              // ignore duplicate
            }
          }
        }
      }
    } catch (err) {
      console.warn('Auto profile enhancement deferred:', err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const { firstName, lastName } = parseFullName(profile.fullName || user?.username || 'Student');
      const email = profile.personalEmail || user?.email || 'student@students.nsbm.ac.lk';

      const payload = {
        userId,
        firstName,
        lastName,
        email,
        phone: profile.phoneNumber || '',
        bio: profile.bio || profile.headline || '',
        profilePicUrl: profile.profilePicUrl || null,
        isActivelyLooking: profile.isActivelyLooking ?? true,
        projects: typeof projects === 'string' ? projects : JSON.stringify(projects || []),
      };

      await userService.updateProfile(userId, payload);

      if (updateUser) {
        updateUser({
          name: profile.fullName,
          fullName: profile.fullName,
          profilePicUrl: profile.profilePicUrl,
        });
      }

      setSuccessMsg('Profile details updated and saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Profile save exception:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save profile changes. Please try again.');
      setTimeout(() => setErrorMsg(''), 5000);
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
    const skillName = newSkill.trim();
    if (!skillName || skills.some(s => s.toLowerCase() === skillName.toLowerCase())) return;
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

  const handleEnhanceFromResume = async () => {
    setEnhancing(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const resRes = await userService.getResumesByUserId(userId);
      const resList = resRes.data?.data || resRes.data || [];
      const primaryResume = resList.find((r) => r.isPrimary) || resList[0];

      if (!primaryResume) {
        setErrorMsg('Please upload a primary resume in "My Resumes" first to enhance your profile.');
        setEnhancing(false);
        return;
      }

      const aiRes = await aiService.enhanceProfileFromResume(userId, primaryResume.fileUrl, skills);
      const data = aiRes.data;

      if (data && data.status === 'success') {
        const newProjects = Array.isArray(data.projects) ? data.projects : [];
        const incomingSkills = Array.isArray(data.skills) ? data.skills : [];
        const mergedSkills = Array.from(new Set([...skills, ...incomingSkills]));

        setProjects(newProjects);
        setSkills(mergedSkills);
        if (data.bio) {
          setProfile((prev) => ({ ...prev, bio: data.bio }));
        }

        const { firstName, lastName } = parseFullName(profile.fullName || user?.username || 'Student');
        const email = profile.personalEmail || user?.email || 'student@students.nsbm.ac.lk';

        // Persist immediately to user-profile backend
        await userService.updateProfile(userId, {
          userId,
          firstName,
          lastName,
          email,
          phone: profile.phoneNumber || '',
          bio: data.bio || profile.bio || '',
          projects: JSON.stringify(newProjects),
          profilePicUrl: profile.profilePicUrl || null,
          isActivelyLooking: profile.isActivelyLooking ?? true,
        });

        for (const sk of incomingSkills) {
          if (!skills.includes(sk)) {
            try {
              await userService.addSkill(userId, {
                skillName: sk,
                skillLevel: 'ADVANCED',
                category: 'TECHNICAL',
              });
            } catch {
              // ignore duplicate skill insertion
            }
          }
        }

        setSuccessMsg(`Profile successfully updated from "${primaryResume.title || 'Primary Resume'}". Discovered ${incomingSkills.length} verified skills and ${newProjects.length} completed projects.`);
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErrorMsg('Could not extract structured data from resume. Please try again.');
        setTimeout(() => setErrorMsg(''), 5000);
      }
    } catch (err) {
      console.error('Enhance profile error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to enhance profile from primary resume. Please check network and try again.');
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setEnhancing(false);
    }
  };

  const initials = (profile.fullName || user?.username || 'ST')
    .trim()
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Student Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your public academic details, profile picture, verified skills, and project evidence.</p>
        </div>

        <Button
          variant="outline"
          onClick={handleEnhanceFromResume}
          loading={enhancing}
          icon="auto_awesome"
          className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold text-xs shrink-0 self-start sm:self-auto"
        >
          {enhancing ? 'Synthesizing Profile via AI...' : 'Enhance Profile from Primary Resume'}
        </Button>
      </div>

      {enhancing && (
        <div className="rounded-2xl p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3.5 shadow-sm animate-pulse">
          <span className="material-symbols-outlined text-emerald-600 animate-spin text-[26px]">progress_activity</span>
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
              Synthesizing Real-Time Candidate Profile from Primary Resume
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
              Extracting completed projects, technical frameworks, and verified skills via Local Neural LLM Engine...
            </div>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[20px]">error</span>
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Avatar & Availability */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <input
                type="file"
                ref={avatarInputRef}
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />

              {/* Student Profile Avatar */}
              <div className="relative group w-28 h-28 mx-auto mb-4">
                {profile.profilePicUrl && !avatarImgError ? (
                  <img
                    src={profile.profilePicUrl}
                    alt={profile.fullName || 'Student Avatar'}
                    className="w-28 h-28 rounded-2xl object-cover shadow-md border-2 border-emerald-500/20 dark:border-emerald-500/30"
                    onError={() => setAvatarImgError(true)}
                  />
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/80 dark:to-teal-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-3xl font-bold shadow-md border-2 border-dashed border-emerald-300 dark:border-emerald-800">
                    {initials}
                  </div>
                )}

                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-slate-900/60 rounded-2xl flex flex-col items-center justify-center text-white text-xs gap-1 backdrop-blur-xs">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </div>
                )}
              </div>

              {/* Avatar Action Controls */}
              <div className="mb-4 space-y-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  icon={uploadingAvatar ? 'hourglass_top' : 'photo_camera'}
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-full justify-center text-xs"
                >
                  {uploadingAvatar
                    ? 'Uploading Photo...'
                    : profile.profilePicUrl
                    ? 'Change Photo'
                    : 'Upload Profile Photo'}
                </Button>

                {profile.profilePicUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-xs text-rose-500 hover:text-rose-600 font-medium py-1 transition-colors block mx-auto"
                  >
                    Remove Photo
                  </button>
                )}
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{profile.fullName || user?.username}</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">{profile.headline || 'Undergraduate Student'}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{academicRecord.degreeProgram || 'Faculty of Computing'} • {academicRecord.currentYear || 'Year 3'}</p>

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
                {skills.map((skill, index) => (
                  <span
                    key={`${skill}-${index}`}
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
                <Input label="Faculty" value={academicRecord.facultyName || ''} disabled />
                <Input label="Degree Programme" value={academicRecord.degreeProgram || ''} disabled />
                <Input label="Cumulative GPA" value={academicRecord.gpa || ''} disabled />
                <Input label="Expected Graduation" value={academicRecord.expectedGraduation || ''} disabled />
              </div>
              <p className="text-xs text-slate-400">
                Official academic records are synchronized directly with NSBM Student Information Systems.
              </p>
            </CardContent>
          </Card>

          {/* Projects Done Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600">code_blocks</span>
                  Completed Projects & Evidence
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified technical implementations extracted directly from your primary resume.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                {projects.length} Project{projects.length === 1 ? '' : 's'}
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-[36px]">folder_open</span>
                  <p className="text-xs text-slate-500 font-medium">No projects extracted yet.</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Click "Enhance Profile from Primary Resume" above to automatically parse your projects and tech stack with AI.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((proj, pIdx) => {
                    const techList = Array.isArray(proj.tech_stack || proj.techStack) 
                      ? (proj.tech_stack || proj.techStack) 
                      : (typeof (proj.tech_stack || proj.techStack) === 'string' ? (proj.tech_stack || proj.techStack).split(',') : []);
                    return (
                      <div 
                        key={pIdx} 
                        className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2 hover:border-emerald-500/30 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500 text-[18px]">terminal</span>
                            {proj.title || 'Untitled Project'}
                          </h4>
                          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                            Verified Implementation
                          </span>
                        </div>

                        {techList.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {techList.map((t, tIdx) => (
                              <span 
                                key={tIdx} 
                                className="px-2 py-0.5 rounded-md bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold"
                              >
                                {t.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        {proj.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                            {proj.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
                    placeholder="e.g. Full-Stack Developer | Cloud Enthusiast"
                  />
                  <div className="md:col-span-2">
                    <Textarea
                      label="Bio / Professional Summary"
                      rows={3}
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Share your technical interests, projects, and career aspirations..."
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
                    placeholder="+94 77 123 4567"
                  />
                  <Input
                    label="LinkedIn Profile URL"
                    value={profile.linkedInUrl}
                    onChange={(e) => setProfile({ ...profile, linkedInUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                  />
                  <Input
                    label="GitHub Profile URL"
                    value={profile.githubUrl}
                    onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
                    placeholder="https://github.com/username"
                  />
                </div>

                <div className="pt-3 flex justify-end">
                  <Button type="submit" loading={saving} icon="save">
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
