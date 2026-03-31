import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.resolve('data');

const getFilePath = (fileName) => path.join(DATA_DIR, `${fileName}.json`);

const readData = async (fileName) => {
  try {
    const filePath = getFilePath(fileName);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

const writeData = async (fileName, data) => {
  const filePath = getFilePath(fileName);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

export const db = {
  users: {
    getAll: () => readData('users'),
    getById: async (id) => {
      const users = await readData('users');
      return users.find((u) => u.id === id);
    },
    getByUsername: async (username) => {
      const users = await readData('users');
      return users.find((u) => u.username === username);
    },
    create: async (user) => {
      const users = await readData('users');
      users.push(user);
      await writeData('users', users);
      return user;
    },
    update: async (id, updates) => {
      const users = await readData('users');
      const index = users.findIndex((u) => u.id === id);
      if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        await writeData('users', users);
        return users[index];
      }
      return null;
    }
  },
  orders: {
    getAll: () => readData('orders'),
    getByUserId: async (userId) => {
      const orders = await readData('orders');
      return orders.filter((o) => o.userId === userId);
    },
    create: async (order) => {
      const orders = await readData('orders');
      orders.push(order);
      await writeData('orders', orders);
      return order;
    },
    updateStatus: async (orderId, status) => {
      const orders = await readData('orders');
      const index = orders.findIndex((o) => o.id === orderId);
      if (index !== -1) {
        orders[index].status = status;
        await writeData('orders', orders);
        return orders[index];
      }
      return null;
    }
  },
  transactions: {
    getAll: () => readData('transactions'),
    getByUserId: async (userId) => {
      const transactions = await readData('transactions');
      return transactions.filter((t) => t.userId === userId);
    },
    create: async (transaction) => {
      const transactions = await readData('transactions');
      transactions.push(transaction);
      await writeData('transactions', transactions);
      return transaction;
    },
    update: async (requestId, updates) => {
      const transactions = await readData('transactions');
      const index = transactions.findIndex((t) => t.request_id === requestId);
      if (index !== -1) {
        transactions[index] = { ...transactions[index], ...updates };
        await writeData('transactions', transactions);
        return transactions[index];
      }
      return null;
    }
  },
  notifications: {
    getByUserId: async (userId) => {
      const all = await readData('notifications');
      return all.filter(n => n.userId === userId);
    },
    create: async (notification) => {
      const all = await readData('notifications');
      all.push({
        id: Math.random().toString(36).substring(2, 9),
        ...notification,
        read: false,
        created_at: new Date().toISOString()
      });
      await writeData('notifications', all);
      return notification;
    },
    markAsRead: async (userId) => {
      const all = await readData('notifications');
      const updated = all.map(n => n.userId === userId ? { ...n, read: true } : n);
      await writeData('notifications', updated);
    }
  }
};
