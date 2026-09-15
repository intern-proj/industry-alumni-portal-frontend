import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Textarea } from '../../components/ui/Input';
import { participationService } from '../../services/participationService';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../contexts/AuthContext';

const RATING_LABELS = {
  1: 'Poor - Needs significant improvement',
  2: 'Fair - Below expectations',
  3: 'Good - Met expectations',
  4: 'Very Good - Exceeded expectations',
  5: 'Excellent - Exceptional experience',
};

export default function EventFeedbackForm() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [eventDetails, setEventDetails] = useState(null);
  const [registrationId, setRegistrationId] = useState(location.state?.registrationId || null);
  const [eventTitle, setEventTitle] = useState(location.state?.eventTitle || '');

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState('');
  const [contentRating, setContentRating] = useState(5);
  const [speakerRating, setSpeakerRating] = useState(5);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Check if feedback was already submitted previously
  const alreadyGiven = participationService.hasSubmittedFeedback(
    eventId,
    registrationId,
    eventTitle || eventDetails?.title
  );

  useEffect(() => {
    if (alreadyGiven) {
      setSubmitted(true);
    }
  }, [alreadyGiven]);

  useEffect(() => {
    let isMounted = true;
    if (eventId) {
      eventService.getEventById(eventId)
        .then((res) => {
          if (isMounted && res.data) {
            setEventDetails(res.data);
            if (!eventTitle) setEventTitle(res.data.title);
          }
        })
        .catch(() => {});
    }

    if (user?.id && !registrationId) {
      participationService.getRegistrations({ userId: user.id })
        .then((res) => {
          if (!isMounted) return;
          const list = Array.isArray(res.data?.content)
            ? res.data.content
            : Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data)
            ? res.data
            : [];
          const match = list.find((r) => String(r.eventId) === String(eventId));
          if (match) {
            setRegistrationId(match.registrationId || match.id);
            if (!eventTitle && match.eventTitle) {
              setEventTitle(match.eventTitle);
            }
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [eventId, user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const regIdToUse = registrationId || `reg-${user?.id || 'student'}-${eventId}`;
    const titleToUse = eventTitle || eventDetails?.title || `Event #${eventId}`;

    try {
      await participationService.submitFeedback({
        registrationId: regIdToUse,
        eventId: String(eventId),
        studentId: user?.id,
        eventTitle: titleToUse,
        rating: parseInt(rating, 10),
        contentRating,
        speakerRating,
        comments,
      });

      setSubmitted(true);
      setMessage('Thank you for submitting your feedback! Your official Certificate of Participation is now unlocked.');
      if (window.toast) {
        window.toast.success('Feedback recorded! Certificate unlocked.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const currentDisplayRating = hoverRating || rating;

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back
        </button>

        <Badge variant="warning" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
          Required for Certificate
        </Badge>
      </div>

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white shadow-lg space-y-2 border border-slate-800">
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
          Student Evaluation
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight">
          {eventTitle || eventDetails?.title || `Event Session #${eventId}`}
        </h1>
        <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
          Your feedback directly drives future campus workshops and validates your active participation. Completing this evaluation immediately unlocks your digital Certificate of Participation.
        </p>
      </div>

      {submitted ? (
        <Card className="border border-emerald-200 dark:border-emerald-800/80 shadow-md rounded-3xl overflow-hidden bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-[36px]">verified</span>
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Feedback Recorded & Certificate Unlocked!
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Thank you for evaluating this session. Your participation has been confirmed and your digital credential is now ready to download and verify.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/student/certificates" className="w-full sm:w-auto">
                <Button variant="primary" size="md" icon="workspace_premium" className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-md">
                  View & Download My Certificate
                </Button>
              </Link>
              <Link to="/student/events" className="w-full sm:w-auto">
                <Button variant="outline" size="md" icon="event" className="w-full">
                  My Registered Events
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">rate_review</span>
              Session Evaluation Form
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Please take a moment to rate your experience across key aspects of this event.
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Overall Star Rating */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Overall Experience Rating *
                </label>
                
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(starVal)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-[36px]">
                        {starVal <= currentDisplayRating ? 'star' : 'star_border'}
                      </span>
                    </button>
                  ))}
                </div>

                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 min-h-[18px]">
                  {RATING_LABELS[currentDisplayRating] || ''}
                </p>
              </div>

              {/* Specific Feedback Categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Content Quality & Relevance
                  </label>
                  <select
                    value={contentRating}
                    onChange={(e) => setContentRating(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={5}>5 - Highly Relevant & Insightful</option>
                    <option value={4}>4 - Very Good & Informative</option>
                    <option value={3}>3 - Satisfactory</option>
                    <option value={2}>2 - Needs More Depth</option>
                    <option value={1}>1 - Not Relevant</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Speaker Delivery & Engagement
                  </label>
                  <select
                    value={speakerRating}
                    onChange={(e) => setSpeakerRating(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={5}>5 - Engaging & Clear</option>
                    <option value={4}>4 - Good Presentation</option>
                    <option value={3}>3 - Average Delivery</option>
                    <option value={2}>2 - Hard to Follow</option>
                    <option value={1}>1 - Poor Presentation</option>
                  </select>
                </div>
              </div>

              {/* Comments / Suggestions */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Detailed Feedback / Suggestions (Optional)
                </label>
                <Textarea
                  placeholder="What did you enjoy most? What topics would you like covered in future sessions?"
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Notice */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0 mt-0.5">workspace_premium</span>
                <p>
                  By submitting this evaluation, your attendance record is marked as complete and your official verified certificate will be immediately unlocked in <strong>My Certificates</strong>.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {error}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon="send"
                  loading={loading}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
                >
                  Submit & Unlock Certificate
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
