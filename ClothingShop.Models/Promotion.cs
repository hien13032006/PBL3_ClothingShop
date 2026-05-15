using System;

namespace ClothingShop.Models
{
    public class Promotion
    {
        public int PromotionId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string DiscountType { get; set; } = "Percent";
        public decimal DiscountValue { get; set; }
        public decimal MinOrderAmount { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsActive { get; set; } = true;

        public bool IsValid()
        {
            if (!IsActive) return false;
            var now = DateTime.Now;
            if (StartDate.HasValue && now < StartDate.Value) return false;
            if (EndDate.HasValue && now > EndDate.Value) return false;
            return true;
        }

        public decimal CalcDiscount(decimal orderAmount)
        {
            return DiscountType == "Percent"
                ? Math.Round(orderAmount * DiscountValue / 100m, 2)
                : Math.Min(DiscountValue, orderAmount);
        }
    }
}
