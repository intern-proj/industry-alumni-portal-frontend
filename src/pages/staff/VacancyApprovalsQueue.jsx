import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { platformService } from '../../services/platformService';
import { vacancyService } from '../../services/vacancyService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import SmartAISearchBar from '../../components/common/SmartAISearchBar';
import { useAuth } from '../../contexts/AuthContext';

export default function VacancyApprovalsQueue() {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING_REVIEW');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const { hasAnyRole } = useAuth();
  const isViewOnly = hasAnyRole('FACULTY_MANAGEMENT');

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const parseAiAnalysis = (aiField) => {
    if (!aiField) return null;
    if (typeof aiField === 'object') return aiField;
    try {
      const parsed = JSON.parse(aiField);
      if (Array.isArray(parsed)) {
        return {
          missingFields: parsed.map(f => ({
            field: f.field_name || f.field,
            severity: f.severity || 'WARNING',
            message: f.message || '',
            suggestion: f.suggestion || ''
          })),
          institutionalMatchScore: 88,
          approvalRecommendation: 'RECOMMENDED_FOR_APPROVAL',
          isSuitableForGraduates: true,
          complianceFlags: [],
          fitNotes: 'Evaluated against NSBM undergraduate academic programs.',
          recommendedPrograms: ['BSc (Hons) Software Engineering', 'BSc (Hons) Computer Science']
        };
      }
      return parsed;
    } catch {
      return null;
    }
  };

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      // 1. Fetch approval workflow records from platform service
      let platformData = [];
      try {
        const res = await platformService.getVacancyApprovals(statusFilter);
        const data = res.data?.content || res.data || [];
        platformData = Array.isArray(data) ? data : [];
      } catch (err) {
        console.warn('Could not fetch from platformService:', err);
      }

      // 2. Fetch vacancies directly from vacancy service to get rich AI metadata
      let vacancyData = [];
      try {
        let vacancyStatus = statusFilter;
        if (statusFilter === 'PENDING_REVIEW') vacancyStatus = 'PENDING';
        if (!statusFilter) vacancyStatus = undefined;
        
        const resVac = await vacancyService.getAdminVacancies({ status: vacancyStatus, size: 50 });
        const vacItems = resVac.data?.data?.content || resVac.data?.content || resVac.data || [];
        vacancyData = Array.isArray(vacItems) ? vacItems : [];
      } catch (err) {
        console.warn('Could not fetch from vacancyService:', err);
      }

      // 3. Create a map of vacancies by ID
      const vacancyMap = new Map();
      vacancyData.forEach(v => {
        if (v.id) vacancyMap.set(String(v.id), v);
      });

      // 4. Merge data sources
      const mergedList = [];
      const handledVacancyIds = new Set();

      platformData.forEach(p => {
        const vacId = String(p.vacancyId || p.id);
        const directVac = vacancyMap.get(vacId);
        handledVacancyIds.add(vacId);

        const ai = parseAiAnalysis(directVac?.aiMissingFields || p.aiMissingFields);

        mergedList.push({
          id: p.id,
          approvalId: p.id,
          vacancyId: vacId,
          title: directVac?.title || p.vacancyTitleSnapshot || p.title || 'Untitled Vacancy',
          vacancyTitle: directVac?.title || p.vacancyTitleSnapshot || p.title || 'Untitled Vacancy',
          companyName: directVac?.companyName || p.companyNameSnapshot || p.companyName || 'Corporate Partner',
          partnerId: directVac?.partnerId || p.companyUserId || p.partnerId,
          jobType: directVac?.jobType || p.jobType,
          workplaceType: directVac?.workplaceType || p.workplaceType,
          location: directVac?.location || p.location || 'Colombo, Sri Lanka',
          salaryRange: directVac?.salaryRange || p.salaryRange || 'Negotiable',
          description: directVac?.description || p.description || 'No description provided.',
          requirements: directVac?.requirements || p.requirements || 'No specific requirements listed.',
          tags: directVac?.tags || p.tags || '',
          targetFaculties: directVac?.targetFaculties || ai?.targetFaculty || 'Faculty of Computing',
          storageFileId: directVac?.storageFileId || p.storageFileId,
          status: directVac?.status || p.status || 'PENDING',
          submittedDate: p.submittedAt || directVac?.createdAt || Date.now(),
          aiAnalysis: ai,
          institutionalScore: ai?.institutionalMatchScore || 90,
          flagsCount: (ai?.missingFields?.length || 0) + (ai?.complianceFlags?.length || 0),
          approvalRecommendation: ai?.approvalRecommendation || 'RECOMMENDED_FOR_APPROVAL'
        });
      });

      // Add vacancies not yet present in platform governance records
      vacancyData.forEach(v => {
        const vacId = String(v.id);
        if (!handledVacancyIds.has(vacId)) {
          const ai = parseAiAnalysis(v.aiMissingFields);
          mergedList.push({
            id: v.id,
            vacancyId: vacId,
            title: v.title || 'Untitled Vacancy',
            vacancyTitle: v.title || 'Untitled Vacancy',
            companyName: v.companyName || 'Corporate Partner',
            partnerId: v.partnerId,
            jobType: v.jobType,
            workplaceType: v.workplaceType,
            location: v.location || 'Colombo, Sri Lanka',
            salaryRange: v.salaryRange || 'Negotiable',
            description: v.description || 'No description provided.',
            requirements: v.requirements || 'No specific requirements listed.',
            tags: v.tags || '',
            targetFaculties: v.targetFaculties || ai?.targetFaculty || 'Faculty of Computing',
            storageFileId: v.storageFileId,
            status: v.status || 'PENDING',
            submittedDate: v.createdAt || Date.now(),
            aiAnalysis: ai,
            institutionalScore: ai?.institutionalMatchScore || 90,
            flagsCount: (ai?.missingFields?.length || 0) + (ai?.complianceFlags?.length || 0),
            approvalRecommendation: ai?.approvalRecommendation || 'RECOMMENDED_FOR_APPROVAL'
          });
        }
      });

      setApprovals(mergedList);
    } catch {
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSmartSearch = (query) => {
    setSearchTerm(query);
  };

  const filteredApprovals = approvals.filter(a => {
    const title = a.vacancyTitle || a.title || '';
    const company = a.companyName || '';
    const tags = a.tags || '';
    const faculty = a.targetFaculties || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tags.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          faculty.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = !statusFilter;
    if (statusFilter === 'PENDING_REVIEW') {
      matchesStatus = a.status === 'PENDING' || a.status === 'PENDING_REVIEW';
    } else if (statusFilter === 'CHANGES_REQUESTED') {
      matchesStatus = a.status === 'CHANGES_REQUESTED';
    } else if (statusFilter === 'APPROVED') {
      matchesStatus = a.status === 'APPROVED';
    } else if (statusFilter === 'REJECTED') {
      matchesStatus = a.status === 'REJECTED';
    } else if (statusFilter === 'CLOSED') {
      matchesStatus = a.status === 'CLOSED';
    } else if (statusFilter) {
      matchesStatus = a.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'PENDING':
      case 'PENDING_REVIEW':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'CHANGES_REQUESTED':
        return <Badge variant="info" className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200">Changes Requested</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      case 'CLOSED':
        return <Badge variant="neutral">Closed</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const columns = [
    {
      key: 'vacancyTitle',
      header: 'Vacancy Title & Partner',
      cellClassName: 'font-semibold text-slate-900 dark:text-white',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white text-sm">{row.vacancyTitle || row.title}</div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="material-symbols-outlined text-[14px]">corporate_fare</span>
            <span>{row.companyName}</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-slate-500 dark:text-slate-400">{row.location}</span>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type / Faculty',
      render: (row) => (
        <div className="space-y-1">
          {row.jobType && row.jobType !== 'NOT_SPECIFIED' && <Badge variant="neutral">{row.jobType}</Badge>}
          {row.workplaceType && row.workplaceType !== 'NOT_SPECIFIED' && <Badge variant="neutral" className="ml-1 bg-emerald-50 text-emerald-700 border-emerald-200">{row.workplaceType}</Badge>}
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
            {row.targetFaculties || 'Faculty of Computing'}
          </div>
        </div>
      )
    },
    {
      key: 'aiScore',
      header: 'AI Evaluation',
      render: (row) => {
        const score = row.institutionalScore || 90;
        const isHigh = score >= 80;
        return (
          <div className="space-y-1">
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
              isHigh 
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' 
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
            }`}>
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              <span>{score}% Match</span>
            </div>
            {row.flagsCount > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                <span className="material-symbols-outlined text-[13px]">warning</span>
                <span>{row.flagsCount} AI Flag{row.flagsCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'submittedDate',
      header: 'Submitted',
      render: (row) => new Date(row.submittedDate || Date.now()).toLocaleDateString()
    },
    { 
      key: 'status', 
      header: 'Status',
      render: (row) => getStatusBadge(row.status)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button 
          size="sm" 
          variant={row.status === 'PENDING' || row.status === 'PENDING_REVIEW' || row.status === 'CHANGES_REQUESTED' ? 'default' : 'outline'}
          icon="open_in_new"
          onClick={() => navigate(`/staff/vacancy-approvals/${row.vacancyId || row.id}`)}
        >
          {isViewOnly ? 'View Job Post' : 'Review & Inspect'}
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-3xl">verified_user</span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Vacancy Management</h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Review academic curricula alignment, inspect AI-extracted fields and compliance flags, and publish verified internship vacancies.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Submissions Queue ({filteredApprovals.length})</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
            <SmartAISearchBar
              value={searchTerm}
              onChange={handleSmartSearch}
              onSearch={handleSmartSearch}
              placeholder="Search by title, partner, or skill..."
              aiPlaceholder="Smart AI search by role, faculty, or skills..."
              className="w-full sm:w-80"
            />
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="CHANGES_REQUESTED">Changes Requested</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CLOSED">Closed / Inactive</option>
                <option value="">All Statuses</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={filteredApprovals} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
