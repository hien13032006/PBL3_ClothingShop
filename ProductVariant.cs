using System;

namespace ClothingShop.Models
{
    public class ProductVariant
    {
        public int VariantId { get; set; }
        public int ProductId { get; set; }
        public string? Color { get; set; }
        public string? Size { get; set; }
        public int StockQuantity { get; set; }
        public decimal PriceAdjustment { get; set; }

        // Not mapped
        public decimal ActualPrice { get; set; }

        // Navigation
        public Product? Product { get; set; }
    }
}
