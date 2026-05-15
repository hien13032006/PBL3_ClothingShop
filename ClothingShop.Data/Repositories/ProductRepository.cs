using Microsoft.EntityFrameworkCore;
using ClothingShop.Data.Interfaces;
using ClothingShop.Models;

namespace ClothingShop.Data.Repositories
{
    public class ProductRepository : BaseRepository<Product>, IProductRepository
    {
        public ProductRepository(AppDbContext context) : base(context) { }

        public async Task<ProductVariant?> GetVariantAsync(int variantId)
            => await _context.ProductVariants.Include(v => v.Product).FirstOrDefaultAsync(v => v.VariantId == variantId);

        public async Task<Product?> GetWithVariantsAsync(int productId)
            => await _context.Products.Include(p => p.Variants).Include(p => p.Images).FirstOrDefaultAsync(p => p.ProductId == productId);

        public async Task UpdateStockAsync(int variantId, int delta)
        {
            var v = await _context.ProductVariants.FindAsync(variantId);
            if (v == null) return;
            v.StockQuantity += delta;
        }
    }
}
