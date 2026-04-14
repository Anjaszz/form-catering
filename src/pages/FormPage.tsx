import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'radio' | 'select';
  options: string[];
  is_required: boolean;
}

const FormPage = () => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // State for dynamic values
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const { data, error } = await supabase
          .from('form_fields')
          .select('*')
          .order('order_index', { ascending: true });

        if (error) throw error;
        setFields(data || []);
        
        // Initialize form data with default options if radio/select
        const initialData: Record<string, any> = {};
        data?.forEach(f => {
          if ((f.type === 'radio' || f.type === 'select') && f.options?.length > 0) {
            initialData[f.label] = f.options[0];
          } else {
            initialData[f.label] = '';
          }
        });
        setFormData(initialData);

      } catch (error: any) {
        toast.error(`Gagal load form: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Validasi sederhana
      for (const field of fields) {
        if (field.is_required && !formData[field.label]) {
          throw new Error(`${field.label} wajib diisi`);
        }
      }

      // Kirim data ke kolom 'payload' (JSONB)
      const { error } = await supabase
        .from('submissions')
        .insert([{
          payload: formData,
          // Support old columns if available for backward compatibility
          name: formData['Nama'] || formData['Nama Lengkap'] || 'User',
          jabatan: formData['Jabatan'] || 'Staff',
          catering_biasa: formData['Catering Biasa'] || 'Pesan',
          catering_overtime: formData['Catering Overtime'] || 'Tidak Pesan',
          shift: formData['Shift'] || 'Pagi'
        }]);

      if (error) throw error;

      setSubmitted(true);
      toast.success('Pemesanan berhasil!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-brand-primary" />
    </div>
  );

  if (submitted) return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card p-12 max-w-md w-full text-center space-y-6">
        <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto" />
        <h2 className="text-3xl font-black text-gradient">Berhasil Terkirim!</h2>
        <p className="text-slate-400 font-medium">Data Anda sudah masuk ke sistem kami.</p>
        <button onClick={() => window.location.reload()} className="w-full py-4 rounded-xl bg-slate-800 font-bold">Kirim Lagi</button>
      </motion.div>
    </div>
  );

  if (fields.length === 0) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-10 max-w-lg text-center space-y-4">
        <AlertCircle className="w-16 h-16 text-amber-500 mx-auto" />
        <h2 className="text-2xl font-black">Form Belum Siap</h2>
        <p className="text-slate-400">Admin belum menambahkan inputan apapun di halaman Pengaturan.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-3 md:p-4 py-8 md:py-16">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-6xl font-black text-gradient mb-2">Form Catering</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-base">Operational Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 md:p-10 space-y-6 md:space-y-10">
          {fields.map((field) => (
            <div key={field.id} className="space-y-3 md:space-y-4">
              <label className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className={cn("w-1.5 h-1.5 rounded-full", field.is_required ? "bg-rose-500" : "bg-slate-700")}></span>
                {field.label}
              </label>

              {field.type === 'text' && (
                <input 
                  required={field.is_required}
                  type="text"
                  placeholder={`Masukkan ${field.label.toLowerCase()}`}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl md:rounded-2xl py-3 md:py-4 px-4 md:px-6 outline-none focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium text-base md:text-lg"
                  value={formData[field.label] || ''}
                  onChange={e => setFormData({...formData, [field.label]: e.target.value})}
                />
              )}

              {field.type === 'radio' && (
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {field.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData({...formData, [field.label]: opt})}
                      className={cn(
                        "py-3 md:py-4 rounded-xl md:rounded-2xl border-2 font-black transition-all text-xs md:text-sm",
                        formData[field.label] === opt 
                          ? "bg-brand-primary/10 border-brand-primary text-white" 
                          : "bg-slate-900/30 border-slate-800 text-slate-600 hover:border-slate-700"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {field.type === 'select' && (
                <div className="relative group">
                  <select 
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl md:rounded-2xl py-3 md:py-4 px-4 md:px-6 outline-none focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary appearance-none font-bold text-base md:text-lg transition-all cursor-pointer hover:bg-slate-800/50"
                    value={formData[field.label]}
                    onChange={e => setFormData({...formData, [field.label]: e.target.value})}
                  >
                    {field.options.map(opt => (
                      <option key={opt} value={opt} className="bg-slate-900">{opt}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-focus-within:text-brand-primary transition-colors">
                    <ChevronDown className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            disabled={submitting}
            type="submit"
            className="w-full py-5 rounded-2xl bg-brand-primary text-white font-black text-xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-brand-primary/20"
          >
            {submitting ? <Loader2 className="w-8 h-8 animate-spin" /> : <>Kirim Laporan <Send className="w-6 h-6" /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FormPage;
