import { supabase } from '../client';

// ============================================================
// Supabase Data Services for SIMPRO Modules
// ============================================================

export const supabaseProfiles = {
  async getAll() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, user_roles(role)');
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
};

export const supabaseComplaints = {
  async getAll() {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getByTicket(kodeTiket: string) {
    const { data, error } = await supabase
      .from('complaints')
      .select('*, complaint_messages(*)')
      .eq('kode_tiket', kodeTiket)
      .single();
    if (error) throw error;
    return data;
  },

  async create(complaint: {
    kode_tiket: string;
    kategori: string;
    judul: string;
    isi_aduan: string;
    is_sensitif?: boolean;
  }) {
    const { data, error } = await supabase
      .from('complaints')
      .insert([complaint])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

export const supabasePublications = {
  async getAll() {
    const { data, error } = await supabase
      .from('publications')
      .select('*, publication_authors(*), profiles(nama_lengkap)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
};

export const supabasePartner = {
  async getSurveys() {
    const { data, error } = await supabase
      .from('partner_surveys')
      .select('*, survey_questions(*)');
    if (error) throw error;
    return data;
  },

  async getResponses() {
    const { data, error } = await supabase
      .from('partner_responses')
      .select('*, partner_invitations(partner_institutions(nama_instansi))');
    if (error) throw error;
    return data;
  },
};

