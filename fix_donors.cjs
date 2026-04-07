const { db } = require('./db.js');

async function fixDonations() {
  try {
    const orders = await db.orders.getAll();
    const donations = orders.filter(o => (o.product_id === 'donation' || (o.options && o.options.type === 'donation')));
    
    const userDonations = {};
    donations.forEach(d => {
      userDonations[d.user_id] = (userDonations[d.user_id] || 0) + (d.total || 0);
    });

    for (const [userId, amount] of Object.entries(userDonations)) {
      const user = await db.users.getById(userId);
      if (user) {
        const newTotal = (user.total_topup || 0) + amount;
        const newVip = (user.vip_points || 0) + amount;
        await db.users.update(userId, { total_topup: newTotal, vip_points: newVip });
        console.log(`Updated user ${user.username} with ${amount} recorded donation.`);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

fixDonations();
