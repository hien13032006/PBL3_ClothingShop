namespace ClothingShop.Models
{
    public class Product
    {
        public int ProductId { get; set; }
        public int CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal BasePrice { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public int SoldCount { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation — Category, ProductVariant, ProductReview, ProductImage
        // đều cùng namespace ClothingShop.Models
        public Category? Category { get; set; }
        public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
        public ICollection<ProductReview> Reviews { get; set; } = new List<ProductReview>();
        public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    }
}
