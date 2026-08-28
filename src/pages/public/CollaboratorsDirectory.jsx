import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Link } from 'react-router-dom';
import { platformService } from '../../services/platformService';
import SmartAISearchBar from '../../components/common/SmartAISearchBar';

export default function CollaboratorsDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('ALL');
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedPartners();
  }, []);

  const fetchApprovedPartners = async () => {
    setLoading(true);
    try {
      const res = await platformService.getPartnerVerifications('APPROVED');
      const data = res.data?.content || res.data || [];
      if (Array.isArray(data)) {
        setPartners(data.map(p => ({
          id: p.id,
          name: p.companyName || p.organizationName || 'Industry Partner',
          industry: p.industry || 'Industry & Technology',
          location: p.address || 'Sri Lanka',
          tier: 'Verified Partner',
          mouStatus: 'Active MoU',
          description: p.notes || p.description || 'Verified industrial partner collaborating with NSBM Green University.',
          tags: p.tags ? (typeof p.tags === 'string' ? p.tags.split(',') : p.tags) : ['Industry Collaboration']
        })));
      } else {
        setPartners([]);
      }
    } catch {
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPartners = partners.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesIndustry = industryFilter === 'ALL' || p.industry.toLowerCase().includes(industryFilter.toLowerCase());
    return matchesSearch && matchesIndustry;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 sm:px-8 py-10">
      {/* Hero Header */}
      <div className="rounded-3xl p-8 bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-purple-500/15 dark:from-emerald-950/40 dark:via-slate-900 dark:to-purple-950/40 border border-emerald-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
            <span className="material-symbols-outlined text-[24px]">domain</span>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Corporate Partners & Collaborators
            </h1>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
              NSBM Official Industry Network
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          Explore leading enterprises, software houses, and global organizations partnered with NSBM to offer verified undergraduate internships, graduate opportunities, and curriculum advisory.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="w-full sm:w-96">
          <SmartAISearchBar 
            placeholder="Search by company name, technology, or tag..."
            aiPlaceholder="Smart AI search by company, technology, or location..."
            value={searchTerm}
            onChange={(val) => setSearchTerm(val)}
            onSearch={(val) => setSearchTerm(val)}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select 
            value={industryFilter} 
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="w-full sm:w-48"
          >
            <option value="ALL">All Industries</option>
            <option value="IT">IT & Software</option>
            <option value="Banking">Banking & Finance</option>
            <option value="Media">Media & Design</option>
            <option value="Cyber">Cybersecurity</option>
          </Select>

          <Link to="/partner/register">
            <Button size="sm" icon="add" className="whitespace-nowrap">
              Become a Partner
            </Button>
          </Link>
        </div>
      </div>

      {/* Partners Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs">Loading approved partner directory...</div>
      ) : filteredPartners.length === 0 ? (
        <div className="p-16 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px]">domain_disabled</span>
          </div>
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No Corporate Partners Listed</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Approved partner organizations will appear here once faculty coordinators complete institutional verification.
          </p>
          <div className="pt-2">
            <Link to="/partner/register">
              <Button size="sm" variant="outline">Submit Partnership Application</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPartners.map((partner) => (
            <Card key={partner.id} className="hover:border-emerald-500/40 hover:shadow-md transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{partner.name}</h3>
                      <Badge variant="success" className="text-[10px]">
                        {partner.mouStatus}
                      </Badge>
                    </div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{partner.industry}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {partner.location}
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shrink-0">
                    {partner.tier}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {partner.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {partner.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px]">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Verified Industry Partner
                  </span>
                  <Link to="/vacancies">
                    <Button size="sm" variant="ghost" className="text-xs text-emerald-600 dark:text-emerald-400">
                      View Vacancies →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
