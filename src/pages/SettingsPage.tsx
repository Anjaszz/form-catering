import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Settings, 
  Type, 
  List, 
  Save, 
  Loader2,
  X,
  Edit2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface FormField {
  id?: string;
  label: string;
  type: 'text' | 'radio' | 'select';
  options: string[];
  is_required: boolean;
  order_index: number;
}

const SettingsPage = () => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Field State
  const [currentField, setCurrentField] = useState<FormField>({
    label: '',
    type: 'text',
    options: ['Pesan', 'Tidak Pesan'],
    is_required: true,
    order_index: 0
  });

  const fetchFields = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('form_fields')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setFields(data || []);
    } catch (error: any) {
      toast.error(`Gagal load: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentField({
      label: '',
      type: 'text',
      options: ['Pesan', 'Tidak Pesan'],
      is_required: true,
      order_index: fields.length
    });
    setShowModal(true);
  };

  const openEditModal = (field: FormField) => {
    setIsEditing(true);
    setCurrentField({ ...field });
    setShowModal(true);
  };

  const saveField = async () => {
    if (!currentField.label) return toast.error('Label harus diisi');
    setSaving(true);
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('form_fields')
          .update({
            label: currentField.label,
            type: currentField.type,
            options: currentField.options,
            is_required: currentField.is_required
          })
          .eq('id', currentField.id);
        if (error) throw error;
        toast.success('Field diperbarui');
      } else {
        const { error } = await supabase
          .from('form_fields')
          .insert([currentField]);
        if (error) throw error;
        toast.success('Field ditambahkan');
      }
      setShowModal(false);
      fetchFields();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteField = async (id: string) => {
    if (!confirm('Hapus field ini?')) return;
    try {
      const { error } = await supabase.from('form_fields').delete().eq('id', id);
      if (error) throw error;
      toast.success('Field dihapus');
      fetchFields();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-12 max-w-4xl mx-auto">
      <header className="mb-8 md:mb-12">
        <Link to="/admin" className="flex items-center gap-2 text-slate-500 hover:text-white mb-4 md:mb-6 group transition-colors text-xs md:text-base">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gradient flex items-center gap-3">
              <Settings className="w-8 h-8 md:w-10 md:h-10 text-brand-primary" />
              Pengaturan Form
            </h1>
            <p className="text-slate-400 mt-2 text-sm md:text-base font-medium">Edit atau tambah inputan form Anda</p>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary/80 text-white px-5 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-brand-primary/20 text-sm md:text-base"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            Tambah Input
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {fields.map((field) => (
            <motion.div layout key={field.id} className="glass-card p-4 md:p-6 flex items-center justify-between group bg-white/[0.02]">
              <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                <div className="p-2 md:p-3 bg-slate-800 rounded-lg md:rounded-xl text-slate-500 shrink-0">
                  {field.type === 'text' ? <Type className="w-4 h-4 md:w-5 md:h-5" /> : <List className="w-4 h-4 md:w-5 md:h-5" />}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-black text-base md:text-lg truncate">{field.label}</h3>
                  <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-tighter truncate">
                    {field.type} • {field.options?.length > 0 ? field.options.join(', ') : 'Free Text'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-1 md:gap-2 shrink-0">
                <button 
                  onClick={() => openEditModal(field)}
                  className="p-2 md:p-3 text-slate-600 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg md:rounded-xl transition-all"
                >
                  <Edit2 className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button 
                  onClick={() => deleteField(field.id!)}
                  className="p-2 md:p-3 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg md:rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Add/Edit */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-lg p-6 md:p-8 space-y-5 md:space-y-6 relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowModal(false)} className="absolute top-4 md:top-6 right-4 md:right-6 text-slate-500 hover:text-white"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
              <h2 className="text-xl md:text-2xl font-black">{isEditing ? 'Edit Inputan' : 'Tambah Inputan Baru'}</h2>
              
              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[10px] md:text-xs font-black uppercase text-slate-500 tracking-widest pl-1">Label Input</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 md:py-4 px-4 outline-none focus:ring-2 focus:ring-brand-primary text-sm md:text-base"
                    value={currentField.label}
                    onChange={e => setCurrentField({...currentField, label: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[10px] md:text-xs font-black uppercase text-slate-500 tracking-widest pl-1">Jenis Input</label>
                  <select 
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 md:py-4 px-4 outline-none focus:ring-2 focus:ring-brand-primary font-bold appearance-none text-sm md:text-base"
                    value={currentField.type}
                    onChange={e => setCurrentField({...currentField, type: e.target.value as any})}
                  >
                    <option value="text">Tulis Langsung (Text)</option>
                    <option value="radio">Pilihan (Radio)</option>
                    <option value="select">Dropdown (Select)</option>
                  </select>
                </div>

                {currentField.type !== 'text' && (
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-[10px] md:text-xs font-black uppercase text-slate-500 tracking-widest pl-1">Pilihan (Pisah koma)</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 md:py-4 px-4 outline-none focus:ring-2 focus:ring-brand-primary text-sm md:text-base"
                      value={currentField.options?.join(', ')}
                      onChange={e => setCurrentField({...currentField, options: e.target.value.split(',').map(s => s.trim())})}
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 md:pt-4 flex flex-col md:flex-row gap-2 md:gap-3">
                <button onClick={() => setShowModal(false)} className="order-2 md:order-1 flex-1 py-3 md:py-4 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-sm md:text-base">Batal</button>
                <button disabled={saving} onClick={saveField} className="order-1 md:order-2 flex-[2] py-3 md:py-4 px-6 md:px-8 rounded-xl font-black bg-brand-primary text-white flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 text-sm md:text-base">
                  {saving ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Save className="w-4 h-4 md:w-5 md:h-5" />}
                  {isEditing ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
