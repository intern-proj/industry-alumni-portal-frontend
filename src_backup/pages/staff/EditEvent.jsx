import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function EditEvent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const { user } = useAuth();
  
  const [venues, setVenues] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPosters, setUploadingPosters] = useState({});

  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    coverImage: '',
    eventType: 'WORKSHOP',
    targetFaculties: [],
    startDateTime: '',
    endDateTime: '',
    requiredAttendanceRate: ''
  });

  const [sessions, setSessions] = useState([
    { 
      title: '', description: '', venueId: '', capacity: '', posterImage: '', sessionDate: '', startTime: '', endTime: '',
      lectures: []
    }
  ]);

  const facultiesList = ['COMPUTING', 'BUSINESS', 'ENGINEERING'];

  useEffect(() => {
    const fetchDependenciesAndEvent = async () => {
      try {
        const [venuesRes, speakersRes, eventRes] = await Promise.all([
          eventService.getVenues(),
          eventService.getSpeakers(),
          eventService.getEventById(id)
        ]);
        setVenues(venuesRes.data?.content || venuesRes.data || []);
        setSpeakers(speakersRes.data?.content || speakersRes.data || []);
        
        const ev = eventRes.data?.data || eventRes.data;
        setEventData({
          title: ev.title || '',
          description: ev.description || '',
          coverImage: ev.coverImage || '',
          eventType: ev.eventType || 'WORKSHOP',
          targetFaculties: ev.targetFaculties ? ev.targetFaculties.split(',') : [],
          startDateTime: ev.startDateTime ? ev.startDateTime.substring(0, 16) : '',
          endDateTime: ev.endDateTime ? ev.endDateTime.substring(0, 16) : '',
          requiredAttendanceRate: ev.requiredAttendanceRate || ''
        });

        if (ev.sessions && ev.sessions.length > 0) {
          setSessions(ev.sessions.map(s => ({
            id: s.id,
            title: s.title || '',
            description: s.description || '',
            venueId: s.venueId || (s.venueName === 'Online' ? 'ONLINE' : ''),
            capacity: s.capacity || '',
            posterImage: s.posterImage || '',
            sessionDate: s.startTime ? s.startTime.substring(0, 10) : '',
            startTime: s.startTime ? s.startTime.substring(11, 16) : '',
            endTime: s.endTime ? s.endTime.substring(11, 16) : '',
            lectures: (s.lectures || []).map(l => ({
              id: l.id,
              title: l.title || '',
              description: l.description || '',
              speakerId: l.speakerId || '',
              startTime: l.startTime ? l.startTime.substring(11, 16) : '',
              endTime: l.endTime ? l.endTime.substring(11, 16) : ''
            }))
          })));
        }

      } catch (err) {
        console.error('Failed to load data', err);
        setErrorMsg('Failed to load event details.');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchDependenciesAndEvent();
  }, [id]);

  if (initialLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleEventChange = (e) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  const handleFacultyToggle = (faculty) => {
    if (eventData.targetFaculties.includes(faculty)) {
      setEventData({ ...eventData, targetFaculties: eventData.targetFaculties.filter(f => f !== faculty) });
    } else {
      setEventData({ ...eventData, targetFaculties: [...eventData.targetFaculties, faculty] });
    }
  };

  const handleSessionChange = (index, field, value) => {
    const newSessions = [...sessions];
    newSessions[index][field] = value;
    setSessions(newSessions);
  };

  const handleLectureChange = (sessionIndex, lectureIndex, field, value) => {
    const newSessions = [...sessions];
    newSessions[sessionIndex].lectures[lectureIndex][field] = value;
    setSessions(newSessions);
  };

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingCover(true);
    try {
      const res = await storageService.uploadFile(file, { uploaderId: user?.id || 'staff', fileType: 'OTHER' });
      setEventData({ ...eventData, coverImage: res.data.fileId });
    } catch (err) {
      console.error('Failed to upload cover image', err);
      window.toast.error('Failed to upload cover image.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handlePosterUpload = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPosters({ ...uploadingPosters, [index]: true });
    try {
      const res = await storageService.uploadFile(file, { uploaderId: user?.id || 'staff', fileType: 'OTHER' });
      handleSessionChange(index, 'posterImage', res.data.fileId);
    } catch (err) {
      console.error('Failed to upload poster image', err);
      window.toast.error('Failed to upload poster image.');
    } finally {
      setUploadingPosters({ ...uploadingPosters, [index]: false });
    }
  };

  const addSession = () => {
    setSessions([...sessions, { title: '', description: '', venueId: '', capacity: '', posterImage: '', sessionDate: '', startTime: '', endTime: '', lectures: [] }]);
  };

  const removeSession = (index) => {
    const newSessions = [...sessions];
    newSessions.splice(index, 1);
    setSessions(newSessions);
  };

  const addLecture = (sessionIndex) => {
    const newSessions = [...sessions];
    newSessions[sessionIndex].lectures.push({ title: '', description: '', speakerId: '', startTime: '', endTime: '' });
    setSessions(newSessions);
  };

  const removeLecture = (sessionIndex, lectureIndex) => {
    const newSessions = [...sessions];
    newSessions[sessionIndex].lectures.splice(lectureIndex, 1);
    setSessions(newSessions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        ...eventData,
        startDateTime: eventData.startDateTime || null,
        endDateTime: eventData.endDateTime || null,
        requiredAttendanceRate: eventData.requiredAttendanceRate ? parseInt(eventData.requiredAttendanceRate) : null,
        targetFaculties: eventData.targetFaculties.join(','),
        sessions: sessions.map((s, idx) => ({
          ...s,
          sequenceOrder: idx + 1,
          venueId: s.venueId === 'ONLINE' ? null : (s.venueId || null),
          capacity: s.capacity ? parseInt(s.capacity) : null,
          startTime: (s.sessionDate && s.startTime) ? `${s.sessionDate}T${s.startTime}` : eventData.startDateTime,
          endTime: (s.sessionDate && s.endTime) ? `${s.sessionDate}T${s.endTime}` : eventData.endDateTime,
          lectures: s.lectures.map((l, lIdx) => ({
            ...l,
            sequenceOrder: lIdx + 1,
            speakerId: l.speakerId || null,
            startTime: (s.sessionDate && l.startTime) ? `${s.sessionDate}T${l.startTime}` : null,
            endTime: (s.sessionDate && l.endTime) ? `${s.sessionDate}T${l.endTime}` : null
          }))
        }))
      };

      await eventService.updateEvent(id, payload);
      navigate(`/staff/events/${id}`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Event</h1>
          <p className="text-slate-500">Update event details, sessions, and guest lectures.</p>
        </div>
        <Button variant="ghost" onClick={() => navigate(`/staff/events/${id}`)}>Cancel</Button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Event Name *</label>
                <Input name="title" value={eventData.title} onChange={handleEventChange} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Required Attendance Rate (%)</label>
                <Input type="number" name="requiredAttendanceRate" placeholder="e.g. 80" min="0" max="100" value={eventData.requiredAttendanceRate} onChange={handleEventChange} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Start Date & Time *</label>
                <Input type="datetime-local" name="startDateTime" value={eventData.startDateTime} onChange={handleEventChange} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">End Date & Time</label>
                <Input type="datetime-local" name="endDateTime" value={eventData.endDateTime} onChange={handleEventChange} />
              </div>
              
              <div className="space-y-2 md:col-span-2 mt-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cover Image</label>
                <div className="flex items-center gap-6 p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-32 h-20 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm border-2 border-white dark:border-slate-700">
                    {eventData.coverImage ? (
                      <img src={storageService.getFileUrl(eventData.coverImage)} alt="Cover Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-slate-400 text-3xl">image</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="relative inline-block">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleCoverImageUpload} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingCover}
                      />
                      <Button type="button" variant="outline" size="sm" loading={uploadingCover}>
                        {eventData.coverImage ? 'Change Cover' : 'Upload Cover'}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">Recommended: 16:9 ratio, max 5MB (JPG, PNG)</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <textarea 
                name="description" 
                value={eventData.description} 
                onChange={handleEventChange}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Target Faculties</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={eventData.targetFaculties.length === 0} onChange={() => setEventData({...eventData, targetFaculties: []})} />
                  All Faculties
                </label>
                {facultiesList.map(faculty => (
                  <label key={faculty} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={eventData.targetFaculties.includes(faculty)} 
                      onChange={() => handleFacultyToggle(faculty)} 
                    />
                    {faculty}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions Details */}
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Sessions & Lectures</CardTitle>
            <Button type="button" onClick={addSession} variant="primary" className="text-sm py-1.5 px-3">
              + Add Session
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {sessions.map((session, index) => (
              <div key={index} className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4 relative">
                {sessions.length > 1 && (
                  <button type="button" onClick={() => removeSession(index)} className="absolute top-4 right-4 text-rose-500 hover:text-rose-700">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                )}
                <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Session {index + 1}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Session Title *</label>
                    <Input value={session.title} onChange={(e) => handleSessionChange(index, 'title', e.target.value)} required placeholder="e.g. Morning Session" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Date *</label>
                    <Input type="date" value={session.sessionDate} onChange={(e) => handleSessionChange(index, 'sessionDate', e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Start Time *</label>
                    <Input type="time" value={session.startTime} onChange={(e) => handleSessionChange(index, 'startTime', e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">End Time</label>
                    <Input type="time" value={session.endTime} onChange={(e) => handleSessionChange(index, 'endTime', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Venue</label>
                    <Select value={session.venueId} onChange={(e) => handleSessionChange(index, 'venueId', e.target.value)}>
                      <option value="">Select Venue...</option>
                      <option value="ONLINE">Online (Virtual)</option>
                      {venues.map(v => <option key={v.id} value={v.id}>{v.name} ({v.capacity} pax)</option>)}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Expected Capacity</label>
                    <Input type="number" placeholder="Optional" value={session.capacity} onChange={(e) => handleSessionChange(index, 'capacity', e.target.value)} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-medium text-slate-500">Session Poster</label>
                    <div className="flex items-center gap-4 p-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                      <div className="w-16 h-16 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm border border-slate-200 dark:border-slate-700">
                        {session.posterImage ? (
                          <img src={storageService.getFileUrl(session.posterImage)} alt="Poster Preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-slate-400 text-2xl">crop_original</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="relative inline-block">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handlePosterUpload(index, e)} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploadingPosters[index]}
                          />
                          <Button type="button" variant="outline" size="sm" loading={uploadingPosters[index]}>
                            {session.posterImage ? 'Change Poster' : 'Upload Poster'}
                          </Button>
                        </div>
                        <p className="text-[10px] text-slate-500">Optional: Portrait image for this session.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Lectures Section */}
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Lectures under this session</h5>
                    <Button type="button" onClick={() => addLecture(index)} variant="outline" size="sm" className="text-xs py-1 h-8">
                      + Add Lecture
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {session.lectures.map((lecture, lIdx) => (
                      <div key={lIdx} className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg relative flex flex-col md:flex-row gap-3 items-start">
                        <div className="flex-1 space-y-3 w-full">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-medium text-slate-500 uppercase">Lecture Title *</label>
                              <Input className="text-sm px-2 py-1 h-8" value={lecture.title} onChange={(e) => handleLectureChange(index, lIdx, 'title', e.target.value)} required placeholder="e.g. Intro to AI" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-medium text-slate-500 uppercase">Guest Speaker</label>
                              <Select className="text-sm px-2 py-1 h-8" value={lecture.speakerId} onChange={(e) => handleLectureChange(index, lIdx, 'speakerId', e.target.value)}>
                                <option value="">Select Speaker...</option>
                                {speakers.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-medium text-slate-500 uppercase">Start Time *</label>
                              <Input type="time" className="text-sm px-2 py-1 h-8" value={lecture.startTime} onChange={(e) => handleLectureChange(index, lIdx, 'startTime', e.target.value)} required />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-medium text-slate-500 uppercase">End Time</label>
                              <Input type="time" className="text-sm px-2 py-1 h-8" value={lecture.endTime} onChange={(e) => handleLectureChange(index, lIdx, 'endTime', e.target.value)} />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-slate-500 uppercase">Description</label>
                            <Input className="text-sm px-2 py-1 h-8" value={lecture.description} onChange={(e) => handleLectureChange(index, lIdx, 'description', e.target.value)} placeholder="Short description of the lecture" />
                          </div>
                        </div>
                        <button type="button" onClick={() => removeLecture(index, lIdx)} className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1.5 rounded-md self-start">
                          <span className="material-symbols-outlined text-sm block">close</span>
                        </button>
                      </div>
                    ))}
                    {session.lectures.length === 0 && (
                      <p className="text-sm text-slate-500 italic py-2 text-center border border-dashed border-slate-300 rounded-lg">No lectures added yet. A session usually contains multiple lectures.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate(`/staff/events/${id}`)}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Event'}
          </Button>
        </div>
      </form>
    </div>
  );
}
