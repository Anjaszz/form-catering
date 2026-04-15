import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Download, 
  RefreshCcw, 
  Search, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Settings,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { format, isToday, parseISO, isSameMonth } from 'date-fns';

interface FormField {
  id: string;
  label: string;
  type: string;
  options?: string[];
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
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
  const [editPayload, setEditPayload] = useState<Record<string, any>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Month Download State
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: fieldsData } = await supabase
        .from('form_fields')
        .select('*')
        .order('order_index', { ascending: true });
      
      setFields(fieldsData || []);

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

  const todaySubmissions = useMemo(() => 
    submissions.filter(s => isToday(parseISO(s.created_at))),
  [submissions]);

  const groupedData = useMemo(() => {
    const sorted = [...submissions].filter(s => {
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

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    submissions.forEach(s => {
      months.add(format(parseISO(s.created_at), 'yyyy-MM'));
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [submissions]);

  const exportDailyExcel = (date: string, data: Submission[]) => {
    const exportData = data.map(s => {
      const row: Record<string, any> = { 'Jam': format(parseISO(s.created_at), 'HH:mm') };
      fields.forEach(f => {
        row[f.label] = s.payload?.[f.label] || '-';
      });
      return row;
    });
    // Calculate Summary Values
    const totalData = data.length;
    
    const biasaKey = fields.find(f => f.label.toLowerCase().includes('biasa'))?.label;
    const totalBiasa = data.filter(s => biasaKey && s.payload?.[biasaKey] === 'Pesan').length;

    const overtimeKey = fields.find(f => f.label.toLowerCase().includes('overtime'))?.label;
    const totalOvertime = data.filter(s => overtimeKey && s.payload?.[overtimeKey] === 'Pesan').length;

    const summaryRows = [
      {}, // Empty row
      { 'Jam': 'RINGKASAN LAPORAN', [fields[0]?.label || 'Info']: '' },
      { 'Jam': 'Total Data', [fields[0]?.label || 'Info']: totalData },
      { 'Jam': 'Total Pesan Biasa', [fields[0]?.label || 'Info']: totalBiasa },
      { 'Jam': 'Total Pesan Overtime', [fields[0]?.label || 'Info']: totalOvertime }
    ];

    const finalData = [...exportData, ...summaryRows];
    const worksheet = XLSX.utils.json_to_sheet(finalData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    XLSX.writeFile(workbook, `laporan_${date}.xlsx`);
    toast.success(`Laporan ${date} berhasil diunduh`);
  };

  const exportMonthlyExcel = () => {
    const now = new Date();
    const monthlyData = Object.entries(groupedData).filter(([date]) => 
      isSameMonth(parseISO(date), now)
    );

    if (monthlyData.length === 0) {
      toast.error('Tidak ada data di bulan ini untuk diunduh');
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();

      // Sort dates descending for sheets
      const sortedDates = monthlyData
        .map(([date]) => date)
        .sort((a, b) => b.localeCompare(a));

      sortedDates.forEach(date => {
        const data = groupedData[date];
        const exportData = data.map(s => {
          const row: Record<string, any> = { 'Jam': format(parseISO(s.created_at), 'HH:mm') };
          fields.forEach(f => {
            row[f.label] = s.payload?.[f.label] || '-';
          });
          return row;
        });

        const totalData = data.length;
        const biasaKey = fields.find(f => f.label.toLowerCase().includes('biasa'))?.label;
        const totalBiasa = data.filter(s => biasaKey && s.payload?.[biasaKey] === 'Pesan').length;
        const overtimeKey = fields.find(f => f.label.toLowerCase().includes('overtime'))?.label;
        const totalOvertime = data.filter(s => overtimeKey && s.payload?.[overtimeKey] === 'Pesan').length;

        const summaryRows = [
          {},
          { 'Jam': 'RINGKASAN LAPORAN', [fields[0]?.label || 'Info']: '' },
          { 'Jam': 'Total Data', [fields[0]?.label || 'Info']: totalData },
          { 'Jam': 'Total Pesan Biasa', [fields[0]?.label || 'Info']: totalBiasa },
          { 'Jam': 'Total Pesan Overtime', [fields[0]?.label || 'Info']: totalOvertime }
        ];

        const finalData = [...exportData, ...summaryRows];
        const worksheet = XLSX.utils.json_to_sheet(finalData);
        
        // Sheet name format: yyyy-MM-dd
        XLSX.utils.book_append_sheet(workbook, worksheet, date);
      });

      XLSX.writeFile(workbook, `laporan_bulan_${format(now, 'MMM_yyyy')}.xlsx`);
      toast.success(`Laporan bulan ${format(now, 'MMMM')} berhasil diunduh`);
    } catch (error: any) {
      toast.error(`Gagal mengunduh: ${error.message}`);
    }
  };
  const exportSpecificMonth = (monthYear: string) => {
    const targetDate = parseISO(`${monthYear}-01`);
    const itemsInMonth = submissions.filter(s => isSameMonth(parseISO(s.created_at), targetDate));
    
    if (itemsInMonth.length === 0) {
      toast.error('Tidak ada data di bulan tersebut');
      return;
    }

    const grouped = itemsInMonth.reduce((acc, curr) => {
      const dateKey = format(parseISO(curr.created_at), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(curr);
      return acc;
    }, {} as Record<string, Submission[]>);

    try {
      const workbook = XLSX.utils.book_new();
      const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

      sortedDates.forEach(date => {
        const data = grouped[date];
        const exportData = data.map(s => {
          const row: Record<string, any> = { 'Jam': format(parseISO(s.created_at), 'HH:mm') };
          fields.forEach(f => {
            row[f.label] = s.payload?.[f.label] || '-';
          });
          return row;
        });

        const totalData = data.length;
        const biasaKey = fields.find(f => f.label.toLowerCase().includes('biasa'))?.label;
        const totalBiasa = data.filter(s => biasaKey && s.payload?.[biasaKey] === 'Pesan').length;
        const overtimeKey = fields.find(f => f.label.toLowerCase().includes('overtime'))?.label;
        const totalOvertime = data.filter(s => overtimeKey && s.payload?.[overtimeKey] === 'Pesan').length;

        const summaryRows = [
          {},
          { 'Jam': 'RINGKASAN LAPORAN', [fields[0]?.label || 'Info']: '' },
          { 'Jam': 'Total Data', [fields[0]?.label || 'Info']: totalData },
          { 'Jam': 'Total Pesan Biasa', [fields[0]?.label || 'Info']: totalBiasa },
          { 'Jam': 'Total Pesan Overtime', [fields[0]?.label || 'Info']: totalOvertime }
        ];

        const worksheet = XLSX.utils.json_to_sheet([...exportData, ...summaryRows]);
        XLSX.utils.book_append_sheet(workbook, worksheet, date);
      });

      XLSX.writeFile(workbook, `laporan_bulan_${format(targetDate, 'MMM_yyyy')}.xlsx`);
      toast.success(`Laporan bulan ${format(targetDate, 'MMMM yyyy')} berhasil diunduh`);
      setIsMonthModalOpen(false);
    } catch (error: any) {
      toast.error(`Gagal: ${error.message}`);
    }
  };



  // Action Handlers
  const openEditModal = (sub: Submission) => {
    setEditingSubmission(sub);
    setEditPayload({ ...sub.payload });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSubmission) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ payload: editPayload })
        .eq('id', editingSubmission.id);

      if (error) throw error;
      toast.success('Data berhasil diperbarui');
      setIsEditModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data ini secara permanen?')) return;
    try {
      const { error } = await supabase.from('submissions').delete().eq('id', id);
      if (error) throw error;
      toast.success('Data berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
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
          <button 
            onClick={exportMonthlyExcel}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 p-3 md:p-4 px-4 md:px-6 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all text-sm md:text-base font-black shadow-lg shadow-emerald-600/10"
          >
            <Download className="w-4 h-4 md:w-5 md:h-5" />
            <span className="whitespace-nowrap">Bulan Ini</span>
          </button>
          
          <button 
            onClick={() => setIsMonthModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 p-3 md:p-4 px-4 md:px-6 glass rounded-2xl text-slate-300 hover:text-white transition-all text-sm md:text-base font-bold"
          >
            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-brand-primary" />
            <span className="whitespace-nowrap">Pilih Bulan</span>
          </button>

          <Link to="/admin/settings" className="flex-1 md:flex-none flex items-center justify-center gap-2 p-3 md:p-4 px-4 md:px-6 glass rounded-2xl text-slate-300 hover:text-white transition-all text-sm md:text-base text-center">
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
            <span className="whitespace-nowrap">Settings</span>
          </Link>
          <button onClick={fetchData} className="flex-1 md:flex-none flex items-center justify-center gap-2 p-3 md:p-4 px-4 md:px-6 glass rounded-2xl text-slate-300 hover:text-white transition-all text-sm md:text-base">
            <RefreshCcw className={`w-4 h-4 md:w-5 md:h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>


      </header>

      {/* Summary Cards */}
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
              className="p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-all text-center md:text-left"
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
                  className="flex items-center gap-2 p-3 px-6 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-600/10"
                >
                  <Download className="w-4 h-4" /> Excel
                </button>
                {openGroups[date] ? <ChevronUp className="w-6 h-6 text-slate-600" /> : <ChevronDown className="w-6 h-6 text-slate-600" />}
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
                          <th className="p-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {items.map((s) => (
                          <tr key={s.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 text-slate-500 font-bold text-xs whitespace-nowrap">
                              {format(parseISO(s.created_at), 'HH:mm')}
                            </td>
                            {fields.map(f => (
                              <td key={f.id} className="p-4 font-medium min-w-[120px]">
                                {String(s.payload?.[f.label] || '-')}
                              </td>
                            ))}
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openEditModal(s)}
                                  className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-all"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(s.id)}
                                  className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
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

      {/* Edit Submission Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-lg p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
              
              <div>
                <h2 className="text-2xl font-black">Edit Laporan</h2>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">ID: {editingSubmission?.id.slice(0, 8)}</p>
              </div>

              <div className="space-y-5">
                {fields.map(f => (
                  <div key={f.id} className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">{f.label}</label>
                    {f.type === 'text' ? (
                      <input 
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand-primary"
                        value={editPayload[f.label] || ''}
                        onChange={e => setEditPayload({...editPayload, [f.label]: e.target.value})}
                      />
                    ) : (
                      <select 
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand-primary font-bold appearance-none"
                        value={editPayload[f.label] || ''}
                        onChange={e => setEditPayload({...editPayload, [f.label]: e.target.value})}
                      >
                        {f.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 flex gap-3">
                <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 rounded-xl font-bold bg-slate-800 hover:bg-slate-700">Batal</button>
                <button disabled={savingEdit} onClick={handleSaveEdit} className="flex-[2] py-4 rounded-xl font-black bg-brand-primary text-white flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50">
                  {savingEdit ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Simpan Perubahan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Month Selection Modal */}
      <AnimatePresence>
        {isMonthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-md p-8 relative">
              <button onClick={() => setIsMonthModalOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
              
              <div className="mb-6">
                <h2 className="text-2xl font-black flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-brand-primary" />
                  Pilih Bulan
                </h2>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Unduh Laporan Per Bulan</p>
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {availableMonths.map(monthYear => (
                  <button
                    key={monthYear}
                    onClick={() => exportSpecificMonth(monthYear)}
                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-brand-primary/20 rounded-2xl border border-white/5 hover:border-brand-primary/50 transition-all font-bold group"
                  >
                    <span className="text-lg group-hover:text-brand-primary">
                      {format(parseISO(`${monthYear}-01`), 'MMMM yyyy')}
                    </span>
                    <div className="p-2 rounded-lg bg-white/5 group-hover:bg-brand-primary/20 text-slate-500 group-hover:text-brand-primary transition-all">
                      <Download className="w-5 h-5" />
                    </div>
                  </button>
                ))}
                
                {availableMonths.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-xs">Belum ada data tersedia</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardPage;

