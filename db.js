import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role Key for backend

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing. Database operations will fail.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const db = {
  users: {
    getAll: async () => {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return data;
    },
    getById: async (id) => {
      const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    getByUsername: async (username) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('username', username)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    create: async (user) => {
      const { data, error } = await supabase.from('users').insert([user]).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, updates) => {
      const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
  },
  orders: {
    getAll: async () => {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    getByUserId: async (userId) => {
      const { data, error } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    create: async (order) => {
      const { data, error } = await supabase.from('orders').insert([{
        ...order,
        user_id: order.userId // Map camelCase to snake_case if necessary, or keep consistent
      }]).select().single();
      if (error) throw error;
      return data;
    },
    updateStatus: async (orderId, status) => {
      const { data, error } = await supabase.from('orders').update({ status }).eq('id', orderId).select().single();
      if (error) throw error;
      return data;
    }
  },
  transactions: {
    getAll: async () => {
      const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    getByUserId: async (userId) => {
      const { data, error } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    create: async (transaction) => {
      const { data, error } = await supabase.from('transactions').insert([{
        ...transaction,
        user_id: transaction.userId
      }]).select().single();
      if (error) throw error;
      return data;
    },
    update: async (requestId, updates) => {
      const { data, error } = await supabase.from('transactions').update(updates).eq('request_id', requestId).select().single();
      if (error) throw error;
      return data;
    }
  },
  notifications: {
    getByUserId: async (userId) => {
      const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    create: async (notification) => {
      const { data, error } = await supabase.from('notifications').insert([{
        ...notification,
        user_id: notification.userId,
        read: false
      }]).select().single();
      if (error) throw error;
      return data;
    },
    markAsRead: async (userId) => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
      if (error) throw error;
    }
  }
};
