namespace ClothingShop.Models
{
    public class ProductReview
    {
        public int ReviewId { get; set; }
        public int ProductId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string? OrderId { get; set; }

        public int Rating { get; set; }               // 1–5 sao
        public string? Comment { get; set; }
        public bool IsVerifiedPurchase { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation — Product và Customer cùng namespace
        public Product? Product { get; set; }
        public Customer? Customer { get; set; }
    }
}
