using Microsoft.EntityFrameworkCore;
using ClothingShop.Data;
using ClothingShop.Models;
using ClothingShop.Models.DTOs;
using Microsoft.Extensions.Hosting;

namespace ClothingShop.Business.Services
{
    public interface IProductImageService
    {
        Task<ApiResponse<List<ProductImageDto>>> GetImagesAsync(int productId);
        Task<ApiResponse<ProductImageDto>> AddImageAsync(int productId, Stream fileStream, string fileName, long fileSize);
        Task<ApiResponse<string>> SetMainImageAsync(int productId, int imageId);
        Task<ApiResponse<string>> ReorderImagesAsync(int productId, List<int> imageIdOrder);
        Task<ApiResponse<string>> DeleteImageAsync(int imageId);
    }

    public class ProductImageService : IProductImageService
    {
    private readonly AppDbContext   _context;
    private readonly IHostEnvironment _env;

    public ProductImageService(AppDbContext context, IHostEnvironment env)
        {
            _context = context;
            _env     = env;
        }

        public async Task<ApiResponse<List<ProductImageDto>>> GetImagesAsync(int productId)
        {
            var images = await _context.ProductImages
                .Where(i => i.ProductId == productId)
                .OrderBy(i => i.SortOrder)
                .ToListAsync();

            return ApiResponse<List<ProductImageDto>>.Ok(images.Select(MapToDto).ToList());
        }

        public async Task<ApiResponse<ProductImageDto>> AddImageAsync(
            int productId, Stream fileStream, string fileName, long fileSize)
        {
            const long maxSize = 5 * 1024 * 1024;
            if (fileSize > maxSize) return ApiResponse<ProductImageDto>.Fail("Ảnh không vượt quá 5MB");

            var ext = Path.GetExtension(fileName).ToLower();
            if (!new[] { ".jpg", ".jpeg", ".png", ".webp" }.Contains(ext))
                return ApiResponse<ProductImageDto>.Fail("Chỉ chấp nhận .jpg, .png, .webp");

            var product = await _context.Products.FindAsync(productId);
            if (product == null) return ApiResponse<ProductImageDto>.Fail("Sản phẩm không tồn tại");

            var uploadsDir = Path.Combine(_env.ContentRootPath, "wwwroot", "images", "products");
            Directory.CreateDirectory(uploadsDir);

            var uniqueName = $"{Guid.NewGuid():N}{ext}";
            var fullPath   = Path.Combine(uploadsDir, uniqueName);
            await using (var fs = new FileStream(fullPath, FileMode.Create))
                await fileStream.CopyToAsync(fs);

            var url = $"/images/products/{uniqueName}";

            // Xác định sort order
            var maxOrder = await _context.ProductImages
                .Where(i => i.ProductId == productId)
                .Select(i => (int?)i.SortOrder)
                .MaxAsync() ?? -1;

            var isFirst = maxOrder == -1;

            var image = new ProductImage
            {
                ProductId  = productId,
                ImageUrl   = url,
                IsMain     = isFirst,  // Ảnh đầu tiên tự động là ảnh chính
                SortOrder  = maxOrder + 1,
                UploadedAt = DateTime.Now
            };

            // Nếu đây là ảnh đầu tiên, cập nhật ImageUrl của Product luôn
            if (isFirst) product.ImageUrl = url;

            await _context.ProductImages.AddAsync(image);
            await _context.SaveChangesAsync();

            return ApiResponse<ProductImageDto>.Ok(MapToDto(image), "Upload ảnh thành công");
        }

        public async Task<ApiResponse<string>> SetMainImageAsync(int productId, int imageId)
        {
            // Bỏ is_main của tất cả ảnh cùng product
            var all = await _context.ProductImages
                .Where(i => i.ProductId == productId)
                .ToListAsync();
            foreach (var img in all) img.IsMain = false;

            var target = all.FirstOrDefault(i => i.ImageId == imageId);
            if (target == null) return ApiResponse<string>.Fail("Không tìm thấy ảnh");

            target.IsMain = true;

            // Cập nhật ImageUrl của Product
            var product = await _context.Products.FindAsync(productId);
            if (product != null) product.ImageUrl = target.ImageUrl;

            await _context.SaveChangesAsync();
            return ApiResponse<string>.Ok("OK", "Đã đặt làm ảnh chính");
        }

        public async Task<ApiResponse<string>> ReorderImagesAsync(int productId, List<int> imageIdOrder)
        {
            for (int i = 0; i < imageIdOrder.Count; i++)
            {
                var img = await _context.ProductImages
                    .FirstOrDefaultAsync(x => x.ImageId == imageIdOrder[i] && x.ProductId == productId);
                if (img != null) img.SortOrder = i;
            }
            await _context.SaveChangesAsync();
            return ApiResponse<string>.Ok("OK", "Đã cập nhật thứ tự ảnh");
        }

        public async Task<ApiResponse<string>> DeleteImageAsync(int imageId)
        {
            var image = await _context.ProductImages.FindAsync(imageId);
            if (image == null) return ApiResponse<string>.Fail("Không tìm thấy ảnh");

            // Xóa file vật lý
            var fileName = Path.GetFileName(image.ImageUrl);
            var filePath = Path.Combine(_env.ContentRootPath, "wwwroot", "images", "products", fileName);
            if (File.Exists(filePath)) File.Delete(filePath);

            _context.ProductImages.Remove(image);
            await _context.SaveChangesAsync();
            return ApiResponse<string>.Ok("OK", "Đã xóa ảnh");
        }

        private static ProductImageDto MapToDto(ProductImage i) => new()
        {
            ImageId   = i.ImageId,
            ImageUrl  = i.ImageUrl,
            IsMain    = i.IsMain,
            SortOrder = i.SortOrder
        };
    }
}
