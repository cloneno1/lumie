import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role Key for backend

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL: Supabase environment variables are MISSING!');
  console.error('Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
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
    getByTopupId: async (topupId) => {
      const { data, error } = await supabase.from('users').select('*').eq('topup_id', topupId).single();
      if (error && error.code !== 'PGRST116') return null;
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
    getByDiscordId: async (discordId) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('discord_id', discordId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    getByGoogleId: async (googleId) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('google_id', googleId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    getByEmail: async (email) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
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
    },
    delete: async (id) => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
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
        user_id: order.user_id || order.userId,
        username: order.username,
        product_id: order.product_id || order.productId,
        product_name: order.product_name || order.productName,
        price: order.price,
        amount: order.amount,
        options: order.options,
        total: order.total,
        status: order.status || 'pending'
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
        user_id: transaction.user_id || transaction.userId,
        telco: transaction.telco,
        amount: transaction.amount,
        serial: transaction.serial,
        code: transaction.code,
        request_id: transaction.request_id || transaction.requestId,
        status: transaction.status,
        message: transaction.message
      }]).select().single();
      if (error) throw error;
      return data;
    },
    getByRequestId: async (requestId) => {
      const { data, error } = await supabase.from('transactions').select('*').eq('request_id', requestId).single();
      if (error && error.code !== 'PGRST116') throw error;
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
        user_id: notification.user_id || notification.userId,
        title: notification.title,
        content: notification.content,
        type: notification.type,
        read: notification.read !== undefined ? notification.read : false
      }]).select().single();
      if (error) throw error;
      return data;
    },
    markAsRead: async (userId) => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
      if (error) throw error;
    }
  },
  feedbacks: {
    getAll: async () => {
      const { data, error } = await supabase.from('feedbacks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    getByOrderId: async (orderId) => {
      const { data, error } = await supabase.from('feedbacks').select('*').eq('order_id', orderId).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    create: async (feedback) => {
      const { data, error } = await supabase.from('feedbacks').insert([{
        user_id: feedback.user_id || feedback.userId,
        order_id: feedback.order_id || feedback.orderId,
        rating: feedback.rating,
        comment: feedback.comment,
        product_name: feedback.product_name || feedback.productName,
        username: feedback.username
      }]).select().single();
      if (error) throw error;
      return data;
    }
  }
};
