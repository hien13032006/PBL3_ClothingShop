namespace ClothingShop.Models
{
    /// <summary>
    /// Thư viện ảnh của sản phẩm — mỗi sản phẩm có nhiều ảnh
    /// Ảnh đầu tiên (IsMain = true) hiển thị làm ảnh đại diện
    /// </summary>
    public class ProductImage
    {
        public int ImageId { get; set; }
        public int ProductId { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsMain { get; set; } = false;
        public int SortOrder { get; set; } = 0;          // Thứ tự hiển thị
        public DateTime UploadedAt { get; set; } = DateTime.Now;

        public Product? Product { get; set; }
    }
}
