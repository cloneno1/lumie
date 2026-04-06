// VIP Thresholds 
// 1 point = 1,000 VND? Or 1 point = 1 VND? 
// Let's use 1 point = 1 VND according to screenshots 3M = VIP 10.

export const VIP_LEVELS = [
  { level: 0, minPoints: 0, label: 'Thành viên', perk: 'Chưa có ưu đãi' },
  { level: 1, minPoints: 100000, label: 'VIP 1', perk: 'Coupon 2% giảm giá' },
  { level: 2, minPoints: 200000, label: 'VIP 2', perk: 'Coupon 3% giảm giá' },
  { level: 3, minPoints: 400000, label: 'VIP 3', perk: 'Coupon 5% giảm giá' },
  { level: 4, minPoints: 600000, label: 'VIP 4', perk: 'Coupon 7% giảm giá + 1 Gacha ticket' },
  { level: 5, minPoints: 1000000, label: 'VIP 5', perk: 'Coupon 10% giảm giá + 2 Gacha tickets' },
  { level: 6, minPoints: 1500000, label: 'VIP 6', perk: 'Ưu tiên hỗ trợ + Coupon 12%' },
  { level: 7, minPoints: 2000000, label: 'VIP 7', perk: 'Quà tặng sinh nhật + Coupon 15%' },
  { level: 8, minPoints: 2500000, label: 'VIP 8', perk: 'Tặng 1 sản phẩm tháng (2.5M threshold) + Coupon 20%' },
  { level: 9, minPoints: 2800000, label: 'VIP 9', perk: 'Đổi 10 vé gacha/tuần + Siêu Coupon' },
  { level: 10, minPoints: 3000000, label: 'VIP MAX', perk: 'Tất cả đặc quyền + Group kín VIP' },
];

export const calculateVipLevel = (points) => {
  let userLevel = 0;
  for (let i = VIP_LEVELS.length - 1; i >= 0; i--) {
    if (points >= VIP_LEVELS[i].minPoints) {
      userLevel = VIP_LEVELS[i].level;
      break;
    }
  }
  return userLevel;
};
