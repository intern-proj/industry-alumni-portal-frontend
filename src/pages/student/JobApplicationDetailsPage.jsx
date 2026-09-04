import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { applicationService } from '../../services/applicationService';
import { vacancyService } from '../../services/vacancyService';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function JobApplicationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [application, setApplication] = useState(null);
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Application
      const appRes = await applicationService.getApplicationById(id);
      const appData = appRes.data;
      setApplication(appData);

      // 2. Fetch Vacancy Details using vacancyId from application
      if (appData?.vacancyId) {
        try {
          const vacRes = await vacancyService.getVacancyById(appData.vacancyId);
          setVacancy(vacRes.data?.data || vacRes.data);
        } catch (err) {
          console.warn("Could not fetch full vacancy details.", err);
        }
      }
    } catch (err) {
      setError('Failed to load application details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    window.confirmAction({
      title: 'Delete Application',
      message: 'Are you sure you want to delete this application? This action cannot be undone.',
      onConfirm: async () => {
        setDeleting(true);
        try {
          await applicationService.deleteApplication(id, user.id);
          navigate('/student/applications');
        } catch (err) {
          window.toast.error('Failed to delete application. Please try again.');
          setDeleting(false);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white"></div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">{error || 'Application not found'}</h2>
        <Button onClick={() => navigate('/student/applications')}>Back to Applications</Button>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    let variant = 'info';
    if (status === 'UNDER_REVIEW') variant = 'warning';
    if (status === 'SHORTLISTED') variant = 'info';
    if (status === 'INTERVIEW') variant = 'warning';
    if (status === 'PLACED') variant = 'success';
    if (status === 'REJECTED') variant = 'danger';
    return <Badge variant={variant}>{status === 'UNDER_REVIEW' ? 'UNDER REVIEW' : (status || 'APPLIED')}</Badge>;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/student/applications')}
            className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors mb-2"
          >
            <span className="material-symbols-outlined text-[18px] mr-1">arrow_back</span>
            Back to Applications
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Application Details
          </h1>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="danger" 
            onClick={handleDelete}
            disabled={deleting}
          >
            <span className="material-symbols-outlined mr-2 text-[18px]">delete</span>
            {deleting ? 'Deleting...' : 'Delete Application'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {application.status === 'UNDER_REVIEW' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-500 mt-0.5">visibility</span>
              <div>
                <h4 className="font-semibold text-amber-800 dark:text-amber-400">Application Under Review</h4>
                <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">Your application was opened and is currently under review by the hiring team.</p>
              </div>
            </div>
          )}

          {/* Vacancy Info */}
          <Card>
            <CardHeader>
              <CardTitle>Vacancy Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {vacancy ? vacancy.title : `Vacancy ID: ${application.vacancyId}`}
                </h3>
                {vacancy && <p className="text-slate-500 font-medium">{vacancy.companyName}</p>}
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-base">work</span>
                  {vacancy?.jobType || 'Internship'}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-base">location_on</span>
                  {vacancy?.location || 'Not specified'}
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Application Status:</span>
                <div className="flex items-center gap-4">
                  {getStatusBadge(application.status)}
                  {vacancy && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate(`/student/vacancies/${vacancy.id}`)}
                      icon="open_in_new"
                    >
                      View Vacancy
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cover Letter */}
          <Card>
            <CardHeader>
              <CardTitle>Submitted Cover Letter</CardTitle>
            </CardHeader>
            <CardContent>
              {application.coverLetter ? (
                <div 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: application.coverLetter }}
                />
              ) : (
                <p className="text-sm text-slate-500 italic">No cover letter submitted.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submitted Resume</CardTitle>
            </CardHeader>
            <CardContent>
              {application.resumeUrl ? (
                <div className="flex flex-col gap-3">
                  <a 
                    href={application.resumeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center">
                        <span className="material-symbols-outlined">picture_as_pdf</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">View Resume</p>
                        <p className="text-xs text-slate-500">PDF Document</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-600">open_in_new</span>
                  </a>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No resume URL available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
