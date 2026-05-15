using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using ClothingShop.Data;
using ClothingShop.Data.Interfaces;
using ClothingShop.Models;
using ClothingShop.Models.DTOs;

namespace ClothingShop.Business.Services
{
    public interface IProductService
    {
        Task<ApiResponse<PagedResult<ProductSummaryDto>>> GetProductsAsync(ProductFilterDto filter, string? userId = null);
        Task<ApiResponse<ProductDetailDto>> GetProductDetailAsync(int productId, string? userId = null);
        Task<ApiResponse<ProductDetailDto>> CreateProductAsync(CreateProductDto dto);
        Task<ApiResponse<ProductDetailDto>> UpdateProductAsync(int productId, UpdateProductDto dto);
        Task<ApiResponse<string>> DeleteProductAsync(int productId);
        Task<ApiResponse<List<CategoryDto>>> GetCategoriesAsync();
        Task<ApiResponse<CategoryDto>> CreateCategoryAsync(string name, string? description);
        Task<ApiResponse<string>> DeleteCategoryAsync(int categoryId);
        Task<ApiResponse<VariantDto>> UpdateVariantStockAsync(int variantId, int newStock);
        Task<ApiResponse<string>> UpdateStockBatchAsync(UpdateStockBatchDto dto);
        Task<ApiResponse<PagedResult<InventoryItemDto>>> GetInventoryAsync(int page, int pageSize, string? keyword = null);
        Task<ApiResponse<UploadResultDto>> SaveProductImageAsync(Stream fileStream, string fileName, long fileSize);
    }

    public class ProductService : IProductService
    {
        private readonly IProductRepository  _productRepo;
        private readonly IReviewRepository   _reviewRepo;
        private readonly AppDbContext        _context;
        private readonly IHostEnvironment    _env;

        public ProductService(
            IProductRepository  productRepo,
            IReviewRepository   reviewRepo,
            AppDbContext        context,
            IHostEnvironment    env)
        {
            _productRepo = productRepo;
            _reviewRepo  = reviewRepo;
            _context     = context;
            _env         = env;
        }

        // ── Lấy danh sách với filter/sort ────────────────────────────
        public async Task<ApiResponse<PagedResult<ProductSummaryDto>>> GetProductsAsync(
            ProductFilterDto filter, string? userId = null)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Variants)
                .Include(p => p.Reviews)
                .Where(p => p.IsActive)
                .AsQueryable();

            if (filter.CategoryId.HasValue)
                query = query.Where(p => p.CategoryId == filter.CategoryId.Value);

            if (!string.IsNullOrWhiteSpace(filter.Keyword))
            {
                var kw = filter.Keyword.Trim().ToLower();
                query = query.Where(p =>
                    p.Name.ToLower().Contains(kw) ||
                    (p.Description != null && p.Description.ToLower().Contains(kw)));
            }

            if (filter.MinPrice.HasValue) query = query.Where(p => p.BasePrice >= filter.MinPrice.Value);
            if (filter.MaxPrice.HasValue) query = query.Where(p => p.BasePrice <= filter.MaxPrice.Value);

            if (!string.IsNullOrWhiteSpace(filter.Color))
            {
                var col = filter.Color.ToLower();
                query = query.Where(p => p.Variants.Any(v => v.Color != null && v.Color.ToLower().Contains(col)));
            }

            if (!string.IsNullOrWhiteSpace(filter.Size))
            {
                var sz = filter.Size.ToLower();
                query = query.Where(p => p.Variants.Any(v => v.Size != null && v.Size.ToLower() == sz));
            }

            query = filter.SortBy switch
            {
                "price_asc"    => query.OrderBy(p => p.BasePrice),
                "price_desc"   => query.OrderByDescending(p => p.BasePrice),
                "best_selling" => query.OrderByDescending(p => p.SoldCount),
                "top_rated"    => query.OrderByDescending(p =>
                    p.Reviews.Any() ? p.Reviews.Average(r => (double)r.Rating) : 0),
                _              => query.OrderByDescending(p => p.CreatedAt)
            };

            var total    = await query.CountAsync();
            var products = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            // Lấy wishlist của user (nếu đã đăng nhập)
            HashSet<int> wishlistIds = new();
            if (!string.IsNullOrEmpty(userId))
            {
                var ids = await _context.Wishlist
                    .Where(w => w.UserId == userId)
                    .Select(w => w.ProductId)
                    .ToListAsync();
                wishlistIds = ids.ToHashSet();
            }

            return ApiResponse<PagedResult<ProductSummaryDto>>.Ok(new PagedResult<ProductSummaryDto>
            {
                Items      = products.Select(p => MapToSummary(p, wishlistIds)).ToList(),
                TotalCount = total,
                Page       = filter.Page,
                PageSize   = filter.PageSize
            });
        }

        // ── Chi tiết sản phẩm ────────────────────────────────────────
        public async Task<ApiResponse<ProductDetailDto>> GetProductDetailAsync(int productId, string? userId = null)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Variants)
                .Include(p => p.Images.OrderBy(i => i.SortOrder))
                .Include(p => p.Reviews
                    .OrderByDescending(r => r.CreatedAt)
                    .Take(5))
                    .ThenInclude(r => r.Customer)
                .FirstOrDefaultAsync(p => p.ProductId == productId);

            if (product == null)
                return ApiResponse<ProductDetailDto>.Fail("Không tìm thấy sản phẩm");

            var avg   = product.Reviews.Any() ? product.Reviews.Average(r => (double)r.Rating) : 0;
            var total = await _reviewRepo.CountByProductAsync(productId);

            bool isInWishlist = false;
            if (!string.IsNullOrEmpty(userId))
                isInWishlist = await _context.Wishlist
                    .AnyAsync(w => w.UserId == userId && w.ProductId == productId);

            return ApiResponse<ProductDetailDto>.Ok(MapToDetail(product, avg, total, isInWishlist));
        }

        // ── Admin: CRUD sản phẩm ─────────────────────────────────────
        public async Task<ApiResponse<ProductDetailDto>> CreateProductAsync(CreateProductDto dto)
        {
            var product = new Product
            {
                CategoryId  = dto.CategoryId,
                Name        = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                BasePrice   = dto.BasePrice,
                ImageUrl    = dto.ImageUrl,
                IsActive    = true,
                CreatedAt   = DateTime.Now,
                Variants    = dto.Variants.Select(v => new ProductVariant
                {
                    Color = v.Color?.Trim(), Size = v.Size?.Trim(),
                    StockQuantity = v.StockQuantity, PriceAdjustment = v.PriceAdjustment
                }).ToList()
            };

            await _productRepo.AddAsync(product);
            await _productRepo.SaveChangesAsync();

            var created = await _context.Products
                .Include(p => p.Category).Include(p => p.Variants).Include(p => p.Images)
                .FirstAsync(p => p.ProductId == product.ProductId);

            return ApiResponse<ProductDetailDto>.Ok(MapToDetail(created, 0, 0, false), "Tạo sản phẩm thành công");
        }

        public async Task<ApiResponse<ProductDetailDto>> UpdateProductAsync(int productId, UpdateProductDto dto)
        {
            var product = await _productRepo.GetWithVariantsAsync(productId);
            if (product == null) return ApiResponse<ProductDetailDto>.Fail("Không tìm thấy sản phẩm");

            if (!string.IsNullOrWhiteSpace(dto.Name))  product.Name        = dto.Name.Trim();
            if (dto.Description != null)               product.Description = dto.Description.Trim();
            if (dto.BasePrice.HasValue)                product.BasePrice   = dto.BasePrice.Value;
            if (dto.ImageUrl != null)                  product.ImageUrl    = dto.ImageUrl;
            if (dto.CategoryId.HasValue)               product.CategoryId  = dto.CategoryId.Value;
            if (dto.IsActive.HasValue)                 product.IsActive    = dto.IsActive.Value;

            await _productRepo.UpdateAsync(product);
            await _productRepo.SaveChangesAsync();
            return ApiResponse<ProductDetailDto>.Ok(MapToDetail(product, 0, 0, false), "Cập nhật thành công");
        }

        public async Task<ApiResponse<string>> DeleteProductAsync(int productId)
        {
            var product = await _productRepo.GetByIdAsync(productId);
            if (product == null) return ApiResponse<string>.Fail("Không tìm thấy sản phẩm");
            product.IsActive = false;
            await _productRepo.UpdateAsync(product);
            await _productRepo.SaveChangesAsync();
            return ApiResponse<string>.Ok("OK", "Đã ẩn sản phẩm");
        }

        // ── Categories ───────────────────────────────────────────────
        public async Task<ApiResponse<List<CategoryDto>>> GetCategoriesAsync()
        {
            var cats = await _context.Categories.Include(c => c.Products).ToListAsync();
            return ApiResponse<List<CategoryDto>>.Ok(cats.Select(c => new CategoryDto
            {
                CategoryId   = c.CategoryId,
                Name         = c.Name,
                Description  = c.Description,
                ProductCount = c.Products.Count(p => p.IsActive)
            }).ToList());
        }

        public async Task<ApiResponse<CategoryDto>> CreateCategoryAsync(string name, string? description)
        {
            if (await _context.Categories.AnyAsync(c => c.Name == name.Trim()))
                return ApiResponse<CategoryDto>.Fail("Tên danh mục đã tồn tại");

            var cat = new Category { Name = name.Trim(), Description = description?.Trim() };
            await _context.Categories.AddAsync(cat);
            await _context.SaveChangesAsync();
            return ApiResponse<CategoryDto>.Ok(new CategoryDto
            {
                CategoryId = cat.CategoryId, Name = cat.Name, Description = cat.Description
            }, "Tạo danh mục thành công");
        }

        public async Task<ApiResponse<string>> DeleteCategoryAsync(int categoryId)
        {
            var cat = await _context.Categories.Include(c => c.Products)
                .FirstOrDefaultAsync(c => c.CategoryId == categoryId);
            if (cat == null) return ApiResponse<string>.Fail("Không tìm thấy danh mục");
            if (cat.Products.Any(p => p.IsActive))
                return ApiResponse<string>.Fail("Không thể xóa danh mục đang có sản phẩm");

            _context.Categories.Remove(cat);
            await _context.SaveChangesAsync();
            return ApiResponse<string>.Ok("OK", "Đã xóa danh mục");
        }

        // ── Inventory ────────────────────────────────────────────────
        public async Task<ApiResponse<VariantDto>> UpdateVariantStockAsync(int variantId, int newStock)
        {
            var variant = await _productRepo.GetVariantAsync(variantId);
            if (variant == null) return ApiResponse<VariantDto>.Fail("Không tìm thấy biến thể");
            variant.StockQuantity = newStock;
            _context.ProductVariants.Update(variant);
            await _context.SaveChangesAsync();
            return ApiResponse<VariantDto>.Ok(MapVariant(variant), "Cập nhật tồn kho thành công");
        }

        public async Task<ApiResponse<string>> UpdateStockBatchAsync(UpdateStockBatchDto dto)
        {
            foreach (var item in dto.Items)
            {
                var v = await _context.ProductVariants.FindAsync(item.VariantId);
                if (v == null) return ApiResponse<string>.Fail($"Không tìm thấy variant ID={item.VariantId}");
                v.StockQuantity = item.NewStock;
            }
            await _context.SaveChangesAsync();
            return ApiResponse<string>.Ok("OK", $"Đã cập nhật {dto.Items.Count} biến thể");
        }

        public async Task<ApiResponse<PagedResult<InventoryItemDto>>> GetInventoryAsync(
            int page, int pageSize, string? keyword = null)
        {
            var query = _context.ProductVariants
                .Include(v => v.Product)
                .Where(v => v.Product!.IsActive)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var kw = keyword.ToLower();
                query = query.Where(v => v.Product!.Name.ToLower().Contains(kw));
            }

            var total = await query.CountAsync();
            var items = await query
                .OrderBy(v => v.StockQuantity)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return ApiResponse<PagedResult<InventoryItemDto>>.Ok(new PagedResult<InventoryItemDto>
            {
                Items = items.Select(v => new InventoryItemDto
                {
                    VariantId     = v.VariantId,
                    ProductId     = v.ProductId,
                    ProductName   = v.Product?.Name ?? "",
                    Color         = v.Color,
                    Size          = v.Size,
                    StockQuantity = v.StockQuantity,
                    StockStatus   = v.StockQuantity == 0 ? "Hết hàng"
                                  : v.StockQuantity <  5 ? "Sắp hết"
                                  : "Còn hàng"
                }).ToList(),
                TotalCount = total, Page = page, PageSize = pageSize
            });
        }

        // ── Upload ảnh ───────────────────────────────────────────────
        public async Task<ApiResponse<UploadResultDto>> SaveProductImageAsync(
            Stream fileStream, string fileName, long fileSize)
        {
            if (fileSize > 5 * 1024 * 1024)
                return ApiResponse<UploadResultDto>.Fail("Ảnh không vượt quá 5MB");

            var ext = Path.GetExtension(fileName).ToLower();
            if (!new[] { ".jpg", ".jpeg", ".png", ".webp" }.Contains(ext))
                return ApiResponse<UploadResultDto>.Fail("Chỉ chấp nhận .jpg, .png, .webp");

            var dir  = Path.Combine(_env.ContentRootPath, "wwwroot", "images", "products");
            Directory.CreateDirectory(dir);

            var name = $"{Guid.NewGuid():N}{ext}";
            var path = Path.Combine(dir, name);
            await using (var fs = new FileStream(path, FileMode.Create))
                await fileStream.CopyToAsync(fs);

            return ApiResponse<UploadResultDto>.Ok(new UploadResultDto
            {
                Url = $"/images/products/{name}", FileName = name, FileSizeBytes = fileSize
            }, "Upload thành công");
        }

        // ── Mappers ──────────────────────────────────────────────────
        private static ProductSummaryDto MapToSummary(Product p, HashSet<int> wishlistIds)
        {
            var avg = p.Reviews.Any() ? p.Reviews.Average(r => (double)r.Rating) : 0;
            return new ProductSummaryDto
            {
                ProductId     = p.ProductId,
                Name          = p.Name,
                BasePrice     = p.BasePrice,
                ImageUrl      = p.ImageUrl,
                CategoryName  = p.Category?.Name,
                IsActive      = p.IsActive,
                SoldCount     = p.SoldCount,
                AverageRating = Math.Round(avg, 1),
                ReviewCount   = p.Reviews.Count,
                IsInWishlist  = wishlistIds.Contains(p.ProductId)
            };
        }

        private static ProductDetailDto MapToDetail(Product p, double avg, int totalReviews, bool isInWishlist) => new()
        {
            ProductId     = p.ProductId,
            CategoryId    = p.CategoryId,
            Name          = p.Name,
            Description   = p.Description,
            BasePrice     = p.BasePrice,
            ImageUrl      = p.ImageUrl,
            CategoryName  = p.Category?.Name,
            SoldCount     = p.SoldCount,
            AverageRating = Math.Round(avg, 1),
            ReviewCount   = totalReviews,
            IsInWishlist  = isInWishlist,
            Images        = p.Images.Select(i => new ProductImageDto
            {
                ImageId = i.ImageId, ImageUrl = i.ImageUrl,
                IsMain  = i.IsMain,  SortOrder = i.SortOrder
            }).ToList(),
            Variants = p.Variants.Select(MapVariant).ToList(),
            RecentReviews = p.Reviews.Select(r => new ReviewDto
            {
                ReviewId           = r.ReviewId,
                CustomerName       = r.Customer?.FullName ?? "Ẩn danh",
                Rating             = r.Rating,
                Comment            = r.Comment,
                IsVerifiedPurchase = r.IsVerifiedPurchase,
                CreatedAt          = r.CreatedAt
            }).ToList()
        };

        private static VariantDto MapVariant(ProductVariant v) => new()
        {
            VariantId = v.VariantId, Color = v.Color, Size = v.Size,
            StockQuantity = v.StockQuantity, PriceAdjustment = v.PriceAdjustment, ActualPrice = v.ActualPrice
        };
    }
}
