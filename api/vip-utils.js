// Dựa trên yêu cầu mới: 200k - 5%, 500k - 8%, 1000k - 11%, 2500k - 14%, 5000k - 17% (VIP 1 - VIP 5)
// Các mốc tiếp theo: VIP 6: 9m, VIP 7: 15m, VIP 8: 21m, VIP 9: 28m, VIP 10: 40m

export const VIP_LEVELS = [
  { level: 0, minPoints: 0, label: 'Thành viên', perk: 'Chưa có ưu đãi', discount: 0 },
  { level: 1, minPoints: 200000, label: 'VIP 1', perk: 'Giảm giá 5% + Coupon 1 lần', discount: 5 },
  { level: 2, minPoints: 500000, label: 'VIP 2', perk: 'Giảm giá 8% + Coupon 1 lần', discount: 8 },
  { level: 3, minPoints: 1000000, label: 'VIP 3', perk: 'Giảm giá 11% + Coupon VIP to', discount: 11 },
  { level: 4, minPoints: 2500000, label: 'VIP 4', perk: 'Giảm giá 14% + 1 Vé Gacha tháng', discount: 14 },
  { level: 5, minPoints: 5000000, label: 'VIP 5', perk: 'Giảm giá 17% + Gói YouTube 3thg', discount: 17 },
  { level: 6, minPoints: 9000000, label: 'VIP 6', perk: '3 Deco 66 cá + Quà Gacha Vip', discount: 20 },
  { level: 7, minPoints: 15000000, label: 'VIP 7', perk: '1 Deco 79 + 1 Deco 131', discount: 22 },
  { level: 8, minPoints: 21000000, label: 'VIP 8', perk: '4 Tháng Spotify Premium', discount: 25 },
  { level: 9, minPoints: 28000000, label: 'VIP 9', perk: '4 Tháng Netflix Premium', discount: 28 },
  { level: 10, minPoints: 40000000, label: 'VIP 10', perk: '6 Tháng Gói bất kỳ (Shop)', discount: 30 },
];

export const calculateVipLevel = (points) => {
  let userLevel = 0;
  // Duyệt từ cao xuống thấp để tìm mốc phù hợp nhất
  for (let i = VIP_LEVELS.length - 1; i >= 0; i--) {
    if (points >= VIP_LEVELS[i].minPoints) {
      userLevel = VIP_LEVELS[i].level;
      break;
    }
  }
  return userLevel;
};

export const getVipPerks = (level) => {
  return VIP_LEVELS.find(v => v.level === level) || VIP_LEVELS[0];
};
