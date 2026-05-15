using System;

namespace ClothingShop.Models
{
    public class CartItem
    {
        public int CartId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public int VariantId { get; set; }
        public int Quantity { get; set; }
        public DateTime AddedAt { get; set; } = DateTime.Now;

        public Customer? Customer { get; set; }
        public ProductVariant? Variant { get; set; }
    }
}
