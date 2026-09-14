import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { participationService } from '../../services/participationService';

export default function EventFeedbackForm() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // NOTE: Depending on how the application handles it, you may need the 'registrationId' 
  // instead of just 'eventId' for the API call. 
  // You could pass it via state: const { state } = useLocation(); const registrationId = state?.registrationId;
  const registrationId = 'PLACEHOLDER_REG_ID'; // Ensure you pass/fetch the actual registrationId

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await participationService.submitFeedback({
        registrationId,
        rating: parseInt(rating, 10),
        comments
      });
      setMessage('Thank you for your feedback! You can now check your certificate eligibility.');
      // Optionally redirect back after a delay
      setTimeout(() => navigate('/student/events'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Event Feedback</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Let us know what you thought about event #{eventId}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Rating (1 - 5)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRating(num)}
                    className={`p-2 rounded-full transition-colors flex items-center justify-center ${
                      rating >= num 
                        ? 'text-amber-500 hover:text-amber-600' 
                        : 'text-slate-300 dark:text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[32px]">
                      {rating >= num ? 'star' : 'star'} 
                      {/* Usually you'd toggle filled vs outline star depending on icon font configuration */}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Comments (Optional)
              </label>
              <Textarea
                placeholder="Share your experience..."
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </form>

          {message && (
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              {message}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">error</span>
              {error}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
        Cancel
      </Button>
    </div>
  );
}
