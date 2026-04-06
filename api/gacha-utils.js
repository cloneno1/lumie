/**
 * Gacha Gifts and Odds
 * Base Odds (VIP 0):
 * Netflix 1 month: 0.5% (Rare)
 * Spotify 1 month: 1.0% (Rare)
 * Deco 66 cá: 1.5% (Rare)
 * 20,000 VNĐ: 5.0% (Valuable)
 * YouTube Premium 1 month: 12.0% (Medium)
 * 10,000 VNĐ: 25.0% (Common)
 * 5,000 VNĐ: 55.0% (Common)
 *
 * VIP Bonus increases rare drop rates.
 */

export const GACHA_REWARDS = [
  { id: 'netflix_1m', name: 'Gói Netflix 1 tháng', type: 'product', baseProb: 0.5, color: '#e50914' },
  { id: 'spotify_1m', name: 'Gói Spotify 1 tháng', type: 'product', baseProb: 1.0, color: '#1db954' },
  { id: 'deco_66', name: 'Deco 66 cá', type: 'deco', baseProb: 1.5, color: '#3b82f6' },
  { id: 'cash_20k', name: '20,000 VNĐ', type: 'cash', value: 20000, baseProb: 5.0, color: '#f59e0b' },
  { id: 'ytb_1m', name: 'Gói YouTube Premium 1 tháng', type: 'product', baseProb: 12.0, color: '#ff0000' },
  { id: 'cash_10k', name: '10,000 VNĐ', type: 'cash', value: 10000, baseProb: 25.0, color: '#10b981' },
  { id: 'cash_5k', name: '5,000 VNĐ', type: 'cash', value: 5000, baseProb: 55.0, color: '#6366f1' },
];

/**
 * Calculates a random reward based on VIP level.
 * @param {number} vipLevel 0 to 10
 * @returns {object} Selected reward
 */
export const rollGacha = (vipLevel = 0) => {
  // VIP Bonus multiplier for rare items (id: netflix, spotify, deco, cash_20k)
  // VIP 1: 1.1x, VIP 10: 2x
  const multiplier = 1 + (vipLevel * 0.1); 
  
  let totalWeight = 0;
  const currentPool = GACHA_REWARDS.map(reward => {
    let prob = reward.baseProb;
    if (reward.baseProb < 10) { // Rare items
      prob = reward.baseProb * multiplier;
    }
    totalWeight += prob;
    return { ...reward, weight: prob };
  });

  const rand = Math.random() * totalWeight;
  let runningSum = 0;
  
  for (const reward of currentPool) {
    runningSum += reward.weight;
    if (rand <= runningSum) {
      return reward;
    }
  }
  
  return GACHA_REWARDS[GACHA_REWARDS.length - 1]; // Fallback to last item
};
