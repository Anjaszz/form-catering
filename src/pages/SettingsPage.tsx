import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Settings, 
  Type, 
  List, 
  CheckCircle2, 
  GripVertical, 
  Save, 
  Loader2,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'radio' | 'select';
  options: string[];
  is_required: boolean;
  order_index: number;
}

const SettingsPage = () => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // New Field State
  const [newField, setNewField] = useState<Partial<FormField>>({
    label: '',
    type: 'text',
    options: ['Pesan', 'Tidak Pesan'],
    is_required: true
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
      toast.error(`Gagal load fields: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const addField = async () => {
    if (!newField.label) return toast.error('Label harus diisi');
    setSaving(true);
    try {
      const { error } = await supabase
        .from('form_fields')
        .insert([{
          ...newField,
          order_index: fields.length
        }]);

      if (error) throw error;
      toast.success('Field berhasil ditambahkan');
      setShowAddModal(false);
      setNewField({ label: '', type: 'text', options: ['Pesan', 'Tidak Pesan'] });
      fetchFields();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteField = async (id: string) => {
    if (!confirm('Hapus field ini? Data yang sudah masuk dengan field ini tidak akan terhapus but inputan di form akan hilang.')) return;
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
    <div className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto">
      <header className="mb-12">
        <Link to="/admin" className="flex items-center gap-2 text-slate-500 hover:text-white mb-6 group transition-colors">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-gradient flex items-center gap-3">
              <Settings className="w-10 h-10 text-brand-primary" />
              Pengaturan Form
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Atur inputan yang ingin ditampilkan di form karyawan</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/80 text-white px-6 py-4 rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-brand-primary/20"
          >
            <Plus className="w-5 h-5" />
            Tambah Input
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {fields.length === 0 ? (
            <div className="glass-card p-16 text-center">
              <p className="text-slate-500 font-bold uppercase tracking-widest italic">Belum ada inputan. Silahkan tambah.</p>
            </div>
          ) : (
            fields.map((field) => (
              <motion.div 
                layout
                key={field.id}
                className="glass-card p-6 flex items-center justify-between group bg-white/[0.02]"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-800 rounded-xl text-slate-500">
                    {field.type === 'text' ? <Type className="w-5 h-5" /> : <List className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-black text-lg">{field.label}</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
                      Type: {field.type} • {field.options?.length > 0 ? field.options.join(', ') : 'Free Text'}
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => deleteField(field.id)}
                  className="p-3 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Add Field Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-lg p-8 space-y-6 overflow-hidden relative"
            >
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-black">Tambah Inputan Form</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-widest pl-1">Label Input</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Nama Lengkap"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-4 px-4 outline-none focus:ring-2 focus:ring-brand-primary"
                    value={newField.label}
                    onChange={e => setNewField({...newField, label: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-widest pl-1">Jenis Input</label>
                  <select 
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-4 px-4 outline-none focus:ring-2 focus:ring-brand-primary appearance-none font-bold"
                    value={newField.type}
                    onChange={e => setNewField({...newField, type: e.target.value as any})}
                  >
                    <option value="text">Tulis Langsung (Text)</option>
                    <option value="radio">Pilihan (Radio)</option>
                    <option value="select">Dropdown (Select)</option>
                  </select>
                </div>

                {(newField.type === 'radio' || newField.type === 'select') && (
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-widest pl-1">Pilihan (Pisah dengan koma)</label>
                    <input 
                      type="text" 
                      placeholder="Pesan, Tidak Pesan"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-4 px-4 outline-none focus:ring-2 focus:ring-brand-primary"
                      value={newField.options?.join(', ')}
                      onChange={e => setNewField({...newField, options: e.target.value.split(',').map(s => s.trim())})}
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 transition-all"
                >
                  Batal
                </button>
                <button 
                  disabled={saving}
                  onClick={addField}
                  className="flex-2 py-4 px-8 rounded-xl font-black bg-brand-primary text-white flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand-primary/20 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Simpan Inputan
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
