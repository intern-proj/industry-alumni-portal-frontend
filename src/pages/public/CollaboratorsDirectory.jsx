import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
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
      const res = await authService.getPartnerDirectory();
      let data = [];
      if (Array.isArray(res.data)) data = res.data;
      else if (Array.isArray(res.data?.data)) data = res.data.data;
      else if (Array.isArray(res.data?.content)) data = res.data.content;
      else if (Array.isArray(res.data?.data?.content)) data = res.data.data.content;
      
      if (data.length > 0) {
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
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl shadow-purple-500/10">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold text-white uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">handshake</span>
            NSBM Official Industry Network
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Corporate Partners & Collaborators</h1>
          <p className="text-sm sm:text-base text-white/90 leading-relaxed">
            Explore leading enterprises, software houses, and global organizations partnered with NSBM to offer verified undergraduate internships, graduate opportunities, and curriculum advisory.
          </p>

          <div className="pt-2 max-w-2xl flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SmartAISearchBar 
                placeholder="Search by company name, technology, or tag..."
                aiPlaceholder="Smart AI search by company, technology, or location..."
                value={searchTerm}
                onChange={(val) => setSearchTerm(val)}
                onSearch={(val) => setSearchTerm(val)}
                loading={loading}
              />
            </div>
            <Link to="/partner/register" className="shrink-0">
              <Button size="sm" icon="add" className="h-[42px] whitespace-nowrap bg-white text-purple-600 hover:bg-slate-50">
                Become a Partner
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Industry Filter Bar */}
      <div className="flex justify-end items-center">
        <div className="w-full sm:w-48">
          <Select 
            value={industryFilter} 
            onChange={(e) => setIndustryFilter(e.target.value)}
          >
            <option value="ALL">All Industries</option>
            <option value="IT">IT & Software</option>
            <option value="Banking">Banking & Finance</option>
            <option value="Media">Media & Design</option>
            <option value="Cyber">Cybersecurity</option>
          </Select>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPartners.map((partner) => (
            <Card key={partner.id} className="hover:border-purple-500/40 hover:shadow-sm transition-all flex flex-col">
              <CardContent className="p-4 flex flex-col h-full gap-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{partner.name}</h3>
                      <Badge variant="success" className="text-[8px] px-1.5 py-0">
                        {partner.mouStatus}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold truncate pt-0.5">{partner.industry}</p>
                    <p className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[11px]">location_on</span>
                      <span className="truncate">{partner.location}</span>
                    </p>
                  </div>

                  <span className="px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-semibold shrink-0">
                    {partner.tier}
                  </span>
                </div>

                <p className="flex-1 text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {partner.description}
                </p>

                <div className="flex flex-wrap gap-1">
                  {partner.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-1.5 py-0 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[9px]">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="pt-2 mt-auto border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[9px] text-slate-500 font-medium">
                    Verified Partner
                  </span>
                  <Link to="/vacancies">
                    <Button size="sm" variant="ghost" className="text-[10px] h-6 px-2 text-purple-600 dark:text-purple-400">
                      Openings →
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
