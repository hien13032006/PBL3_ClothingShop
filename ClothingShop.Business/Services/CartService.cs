using ClothingShop.Data.Interfaces;
using ClothingShop.Models;
using ClothingShop.Models.DTOs;

namespace ClothingShop.Business.Services
{
    public interface ICartService
    {
        Task<ApiResponse<CartSummaryDto>> GetCartAsync(string userId);
        Task<ApiResponse<CartSummaryDto>> AddToCartAsync(string userId, AddToCartDto dto);
        Task<ApiResponse<CartSummaryDto>> UpdateQuantityAsync(string userId, UpdateCartDto dto);
        Task<ApiResponse<string>> RemoveItemAsync(string userId, int cartId);
        Task<ApiResponse<string>> ClearCartAsync(string userId);
    }

    public class CartService : ICartService
    {
        private readonly ICartRepository    _cartRepo;
        private readonly IProductRepository _productRepo;

        public CartService(ICartRepository cartRepo, IProductRepository productRepo)
        {
            _cartRepo    = cartRepo;
            _productRepo = productRepo;
        }

        public async Task<ApiResponse<CartSummaryDto>> GetCartAsync(string userId)
        {
            var items = await _cartRepo.GetCartByUserAsync(userId);
            return ApiResponse<CartSummaryDto>.Ok(BuildSummary(items));
        }

        public async Task<ApiResponse<CartSummaryDto>> AddToCartAsync(string userId, AddToCartDto dto)
        {
            var variant = await _productRepo.GetVariantAsync(dto.VariantId);
            if (variant == null) return ApiResponse<CartSummaryDto>.Fail("Sản phẩm không tồn tại");
            if (variant.Product?.IsActive == false)
                return ApiResponse<CartSummaryDto>.Fail("Sản phẩm đã ngưng bán");
            if (variant.StockQuantity < dto.Quantity)
                return ApiResponse<CartSummaryDto>.Fail($"Chỉ còn {variant.StockQuantity} sản phẩm");

            var existing = await _cartRepo.GetCartItemAsync(userId, dto.VariantId);
            if (existing != null)
            {
                var newQty = existing.Quantity + dto.Quantity;
                if (newQty > variant.StockQuantity)
                    return ApiResponse<CartSummaryDto>.Fail(
                        $"Giỏ hàng đã có {existing.Quantity}, tồn kho chỉ còn {variant.StockQuantity}");
                existing.Quantity = newQty;
                await _cartRepo.UpdateAsync(existing);
            }
            else
            {
                await _cartRepo.AddAsync(new CartItem
                {
                    UserId = userId, VariantId = dto.VariantId,
                    Quantity = dto.Quantity, AddedAt = DateTime.Now
                });
            }

            await _cartRepo.SaveChangesAsync();
            var cart = await _cartRepo.GetCartByUserAsync(userId);
            return ApiResponse<CartSummaryDto>.Ok(BuildSummary(cart), "Đã thêm vào giỏ hàng");
        }

        public async Task<ApiResponse<CartSummaryDto>> UpdateQuantityAsync(string userId, UpdateCartDto dto)
        {
            var item = await _cartRepo.GetByIdAsync(dto.CartId);
            if (item == null || item.UserId != userId)
                return ApiResponse<CartSummaryDto>.Fail("Không tìm thấy sản phẩm trong giỏ");

            var variant = await _productRepo.GetVariantAsync(item.VariantId);
            if (variant == null || variant.StockQuantity < dto.Quantity)
                return ApiResponse<CartSummaryDto>.Fail($"Tồn kho không đủ (còn {variant?.StockQuantity ?? 0})");

            item.Quantity = dto.Quantity;
            await _cartRepo.UpdateAsync(item);
            await _cartRepo.SaveChangesAsync();

            var cart = await _cartRepo.GetCartByUserAsync(userId);
            return ApiResponse<CartSummaryDto>.Ok(BuildSummary(cart), "Cập nhật giỏ hàng thành công");
        }

        public async Task<ApiResponse<string>> RemoveItemAsync(string userId, int cartId)
        {
            var item = await _cartRepo.GetByIdAsync(cartId);
            if (item == null || item.UserId != userId)
                return ApiResponse<string>.Fail("Không tìm thấy sản phẩm trong giỏ");
            await _cartRepo.DeleteAsync(item);
            await _cartRepo.SaveChangesAsync();
            return ApiResponse<string>.Ok("OK", "Đã xóa khỏi giỏ hàng");
        }

        public async Task<ApiResponse<string>> ClearCartAsync(string userId)
        {
            await _cartRepo.ClearCartAsync(userId);
            return ApiResponse<string>.Ok("OK", "Đã xóa toàn bộ giỏ hàng");
        }

        private static CartSummaryDto BuildSummary(IEnumerable<CartItem> items)
        {
            var list = items.Select(ci => new CartItemDto
            {
                CartId        = ci.CartId,
                VariantId     = ci.VariantId,
                ProductName   = ci.Variant?.Product?.Name,
                Color         = ci.Variant?.Color,
                Size          = ci.Variant?.Size,
                ImageUrl      = ci.Variant?.Product?.ImageUrl,
                UnitPrice     = ci.Variant?.ActualPrice ?? 0,
                Quantity      = ci.Quantity,
                Subtotal      = (ci.Variant?.ActualPrice ?? 0) * ci.Quantity,
                StockQuantity = ci.Variant?.StockQuantity ?? 0
            }).ToList();

            return new CartSummaryDto
            {
                Items       = list,
                TotalAmount = list.Sum(i => i.Subtotal),
                TotalItems  = list.Sum(i => i.Quantity)
            };
        }
    }
}
