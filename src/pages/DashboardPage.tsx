import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Download, 
  RefreshCcw, 
  Search, 
  Coffee, 
  Moon, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Settings,
  HelpCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { format, isToday, parseISO } from 'date-fns';
import { cn } from '../lib/utils';

interface FormField {
  id: string;
  label: string;
}

interface Submission {
  id: string;
  created_at: string;
  payload: Record<string, any>;
}

const DashboardPage = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Dynamic Fields for Columns
      const { data: fieldsData } = await supabase
        .from('form_fields')
        .select('*')
        .order('order_index', { ascending: true });
      
      setFields(fieldsData || []);

      // 2. Fetch Submissions
      const { data: subData, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(subData || []);
    } catch (error: any) {
      toast.error(`Gagal: ${error.message || 'Error tidak diketahui'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter today's data for summary
  const todaySubmissions = useMemo(() => 
    submissions.filter(s => isToday(parseISO(s.created_at))),
  [submissions]);

  // Group by Date
  const groupedData = useMemo(() => {
    const sorted = [...submissions].filter(s => {
      // Search in all payload values
      const searchStr = search.toLowerCase();
      return Object.values(s.payload || {}).some(val => 
        String(val).toLowerCase().includes(searchStr)
      );
    });
    
    return sorted.reduce((acc, curr) => {
      const dateKey = format(parseISO(curr.created_at), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(curr);
      return acc;
    }, {} as Record<string, Submission[]>);
  }, [submissions, search]);

  const toggleGroup = (date: string) => {
    setOpenGroups(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const exportDailyExcel = (date: string, data: Submission[]) => {
    const exportData = data.map(s => {
      const row: Record<string, any> = { 'Jam': format(parseISO(s.created_at), 'HH:mm') };
      fields.forEach(f => {
        row[f.label] = s.payload?.[f.label] || '-';
      });
      return row;
    });

    // Simple Summary for Excel
    const summaryRows = [
      {},
      { 'Jam': 'TOTAL DATA', [fields[0]?.label || 'Info']: data.length }
    ];

    const finalData = [...exportData, ...summaryRows];
    const worksheet = XLSX.utils.json_to_sheet(finalData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    XLSX.writeFile(workbook, `laporan_${date}.xlsx`);
    toast.success(`Laporan ${date} berhasil diunduh`);
  };

  return (
    <div className="min-h-screen p-4 md:p-12 max-w-7xl mx-auto">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 md:mb-12">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-gradient flex items-center gap-3 md:gap-4">
            <LayoutDashboard className="w-8 h-8 md:w-12 md:h-12 text-brand-primary" />
            Admin Panel
          </h1>
          <p className="text-slate-400 mt-2 md:mt-3 text-sm md:text-lg font-medium">Laporan Harian Dinamis</p>
        </div>

        <div className="flex flex-row flex-wrap items-center gap-3">
          <Link to="/admin/settings" className="flex-1 md:flex-none flex items-center justify-center gap-2 p-3 md:p-4 px-4 md:px-6 glass rounded-2xl text-slate-300 hover:text-white transition-all text-sm md:text-base">
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
            <span className="whitespace-nowrap">Settings</span>
          </Link>
          <button onClick={fetchData} className="flex-1 md:flex-none flex items-center justify-center gap-2 p-3 md:p-4 px-4 md:px-6 glass rounded-2xl text-slate-300 hover:text-white transition-all text-sm md:text-base">
            <RefreshCcw className={`w-4 h-4 md:w-5 md:h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* Summary Cards - Hari Ini Saja */}
      <div className="mb-4 flex items-center gap-2 text-slate-500 font-bold uppercase text-[10px] md:text-xs tracking-widest pl-1">
        <Check className="w-4 h-4 text-emerald-500" /> Ringkasan Hari Ini ({format(new Date(), 'dd MMM yyyy')})
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10 md:mb-16">
        <div className="glass-card p-6 md:p-10 group relative border-l-4 border-slate-700">
          <p className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-widest">Total Hari Ini</p>
          <h3 className="text-4xl md:text-6xl font-black mt-2 md:mt-3">{todaySubmissions.length}</h3>
        </div>
        
        <div className="glass-card p-6 md:p-10 group relative border-l-4 border-emerald-500">
          <p className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-widest text-emerald-500">Catering Biasa</p>
          <h3 className="text-4xl md:text-6xl font-black mt-2 md:mt-3 text-emerald-400">
            {todaySubmissions.filter(s => {
              const key = Object.keys(s.payload || {}).find(k => k.toLowerCase().includes('biasa'));
              return key && s.payload[key] === 'Pesan';
            }).length}
          </h3>
        </div>

        <div className="glass-card p-6 md:p-10 group relative border-l-4 border-brand-secondary">
          <p className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-widest text-brand-secondary">Catering Overtime</p>
          <h3 className="text-4xl md:text-6xl font-black mt-2 md:mt-3 text-brand-secondary">
            {todaySubmissions.filter(s => {
              const key = Object.keys(s.payload || {}).find(k => k.toLowerCase().includes('overtime'));
              return key && s.payload[key] === 'Pesan';
            }).length}
          </h3>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
        <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight">Data Per Hari</h2>
        <div className="relative group w-full md:max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-500 group-focus-within:text-brand-primary" />
          <input 
            type="text" 
            placeholder="Cari data..."
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl md:rounded-2xl py-3 md:py-4 pl-10 md:pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 font-bold text-sm md:text-base transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedData).map(([date, items]) => (
          <div key={date} className="glass overflow-hidden rounded-3xl border border-white/5">
            <div 
              onClick={() => toggleGroup(date)}
              className="p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black">{isToday(parseISO(date)) ? 'HARI INI' : format(parseISO(date), 'EEEE, dd MMM yyyy')}</h3>
                  <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">{items.length} Entries</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={(e) => { e.stopPropagation(); exportDailyExcel(date, items); }}
                  className="flex items-center gap-2 p-3 px-6 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl font-bold text-sm transition-all"
                >
                  <Download className="w-4 h-4" /> Excel
                </button>
                {openGroups[date] ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
              </div>
            </div>

            <AnimatePresence>
              {openGroups[date] && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/5 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 text-slate-500 font-black text-[10px] uppercase tracking-widest">
                          <th className="p-4">Waktu</th>
                          {fields.map(f => (
                            <th key={f.id} className="p-4">{f.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {items.map((s) => (
                          <tr key={s.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 text-slate-500 font-bold text-xs">
                              {format(parseISO(s.created_at), 'HH:mm')}
                            </td>
                            {fields.map(f => (
                              <td key={f.id} className="p-4 font-medium">
                                {String(s.payload?.[f.label] || '-')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
