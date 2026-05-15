const API_BASE_URL = "https://localhost:5001/api";

let products = [];
let mockVouchers = [];

async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`);
        if (!response.ok) throw new Error("Lỗi kết nối API");
        return await response.json();
    } catch (error) {
        console.error("Lỗi Fetch:", error);
        return null;
    }
}

document.addEventListener("DOMContentLoaded", async () => {

    updateCartBadge();

    const path = window.location.pathname;

    // Load dữ liệu API trước
    products = await fetchData("products") || [];
    mockVouchers = await fetchData("vouchers") || [];

    // Trang chủ
    if (path.includes("index.html") || path === "/") {
        initHomePage();
    }

    // Trang chi tiết
    else if (path.includes("chitietsp.html")) {
        initDetailPage();
    }

    // Trang danh mục
    else if (path.includes("danhmuc.html")) {
        initProductPages();
    }

    // Trang giỏ hàng
    else if (path.includes("giohang.html")) {
        renderCart();
    }
});


// Hàm đổ sản phẩm ra HTML
function renderProducts(containerId, productData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (productData.length === 0) {
        container.innerHTML = "<p style='padding: 20px;'>Không tìm thấy sản phẩm nào.</p>";
        return;
    }

    container.innerHTML = productData.map(item => `
        <a href="chitietsp.html?id=${item.id}" class="product-card-link" style="text-decoration: none; color: inherit;">
            <div class="product-card">
                <div class="cart-icon"><i class="fa-solid fa-cart-plus"></i></div>
                <img src="${item.img}" alt="${item.name}">
                <div class="product-info">
                    <p class="product-name">${item.name}</p>
                    <div class="product-bottom">
                        <span class="price">${item.price}</span>
                        <button class="buy-btn">Mua ngay</button>
                    </div>
                </div>
            </div>
        </a>
    `).join('');
}

//Hàm đổ sp mới ra HTML
// Biến lưu vị trí hiện tại của SP Mới
let currentMoiIndex = 0;

function renderProductShowcase(containerId, product) {
    const container = document.getElementById(containerId);
    if (!container || !product) return;

    const descriptionHTML = Array.isArray(product.description)
        ? product.description.map(line => `<p>${line}</p>`).join('')
        : `<p>${product.description || 'Đang cập nhật mô tả...'}</p>`;

    // GHI ĐÈ nội dung kèm theo 2 nút bấm mới
    container.innerHTML = `
        <div class="product-image-section">
           <a href="chitietsp.html?id=${product.id}">
                <img src="${product.img}" alt="${product.name}" class="main-product-img">
            </a>
        </div>

        <div class="product-info-section">
            <a href="chitietsp.html?id=${product.id}" style="text-decoration: none; color: inherit;">
                <h3 class="product-title-highlight">${product.name}</h3>
            </a>
            <div class="product-description">
                <h4>Mô tả</h4>
                ${descriptionHTML}
            </div>
            <div class="product-actions">
                <span class="price">${product.price}</span>
                <button class="buy-now-btn">Mua ngay</button>
                <button class="add-to-cart-btn"><i class="fa-solid fa-cart-plus"></i></button>
            </div>
        </div>

        <button class="slider-btn prev" onclick="moveMoiShowcase(-1)">&#10094;</button>
        <button class="slider-btn next" onclick="moveMoiShowcase(1)">&#10095;</button>
    `;
}

// Hàm đổ Voucher
function renderVouchers(vouchers) {
    const container = document.getElementById('voucher-list');
    if (!container) return;
    container.innerHTML = vouchers.map(vc => `
        <div class="voucher-card">
            <div class="voucher-left">VOUCHER <br> ${vc.value}</div>
            <div class="voucher-right">
                <p class="voucher-desc">${vc.condition}</p>
                <button class="btn-save">Lưu</button>
            </div>
        </div>
    `).join('');
}

function moveSlider(id, direction) {
    const container = document.getElementById(id);
    if (container) {
        // Tự động tính toán khoảng cách cuộn: 
        // Voucher thường rộng hơn (320px), Sản phẩm thường nhỏ hơn (270px)
        const scrollAmount = id === 'voucher-list' ? 320 : 270;

        container.scrollBy({
            left: direction * scrollAmount,
            behavior: 'smooth'
        });
    } else {
        console.error(`Không tìm thấy container có ID: ${id}`);
    }
}

function moveMoiShowcase(direction) {
    const newProducts = products.filter(p => p.type === 'moi');
    if (newProducts.length <= 1) return;

    currentMoiIndex += direction;

    if (currentMoiIndex >= newProducts.length) currentMoiIndex = 0;
    if (currentMoiIndex < 0) currentMoiIndex = newProducts.length - 1;

    renderProductShowcase('showcase-container', newProducts[currentMoiIndex]);
}

function initProductPages() {
    renderVouchers(mockVouchers);

    // Đổ sản phẩm theo khu vực
    renderProducts('product-list', products);
    renderProducts('list-banchay', products.filter(p => p.type === 'banchay'));
    renderProducts('list-khuyenmai', products.filter(p => p.type === 'khuyenmai'));
    renderProducts('main-product-grid', products);

    // Xử lý Showcase sản phẩm mới
    const newProds = products.filter(p => p.type === 'moi');
    if (newProds.length > 0) renderProductShowcase('showcase-container', newProds[0]);

    // B. XỬ LÝ CHO TRANG DANH MỤC 
    const gridContainer = document.getElementById('main-product-grid');
    if (gridContainer) {
        const params = new URLSearchParams(window.location.search);
        const gender = params.get('gender');
        const type = params.get('type');
        const cat = params.get('cat');

        // 1. Xác định trạng thái trang
        const isNewPage = (type === 'moi');
        const showcaseSection = document.querySelector('.SANPHAMMOI');
        const titleElement = document.getElementById('category-title');
        const hrTag = titleElement ? titleElement.nextElementSibling : null;

        renderVouchers(mockVouchers);

        //Xử lý trang sp mới
        if (isNewPage) {
            if (showcaseSection) {
                showcaseSection.style.display = 'block';
                const newProducts = products.filter(p => p.type === 'moi');
                if (newProducts.length > 0) {
                    renderProductShowcase('showcase-container', newProducts[currentMoiIndex]);
                }
            }
            // ẨN hoàn toàn danh sách cũ và tiêu đề bên dưới
            if (gridContainer) gridContainer.style.display = 'none';
            if (titleElement) titleElement.style.display = 'none';
            if (hrTag && hrTag.tagName === 'HR') hrTag.style.display = 'none';

        } else {//Các trang còn lại

            // Ẩn Banner lớn
            if (showcaseSection) showcaseSection.style.display = 'none';

            // Hiện lại Grid và Tiêu đề
            if (gridContainer) gridContainer.style.display = 'grid';
            if (titleElement) titleElement.style.display = 'block';
            if (hrTag && hrTag.tagName === 'HR') hrTag.style.display = 'block';

            let filtered = products;
            let titleParts = [];

            if (gender) {
                filtered = filtered.filter(p => p.gender === gender);
                titleParts.push(gender === 'nam' ? 'THỜI TRANG NAM' : gender === 'nu' ? 'THỜI TRANG NỮ' : 'THỜI TRANG TRẺ EM');
            }
            if (cat) {
                filtered = filtered.filter(p => p.cat === cat);
                const catNames = {
                    'somi': 'Áo Sơ Mi', 'quan': 'Quần', 'thun': 'Áo Thun',
                    'vaydam': 'Váy - Đầm', 'khoak': 'Áo Khoác', 'polo': 'Áo Polo', 'kieu': 'Áo Kiểu'
                };
                titleParts.push(catNames[cat] || cat.toUpperCase());
            }
            if (type) {
                filtered = filtered.filter(p => p.type === type);
                if (type === 'banchay') titleParts = ["Sản phẩm bán chạy"];
                if (type === 'khuyenmai') titleParts = ["Sản phẩm khuyến mãi"];
            }

            if (titleElement) {
                titleElement.innerText = titleParts.length > 0 ? titleParts.join(' - ') : "Tất cả sản phẩm";
            }

            renderProducts('main-product-grid', filtered);
        }
    }
}

function initDetailPage() {
    const params = new URLSearchParams(window.location.search);
    const productId = parseInt(params.get('id'));

    // Tìm sản phẩm dựa trên ID từ mảng products đã có ở trên
    const product = products.find(p => p.id === productId);

    if (product) {
        // 1. Đổ ảnh chính
        const mainImg = document.getElementById('main-img');
        if (mainImg) mainImg.src = product.img;

        // 2. Đổ tên và giá
        const pName = document.getElementById('p-name');
        const pPrice = document.getElementById('p-price');
        if (pName) pName.innerText = product.name;
        if (pPrice) pPrice.innerText = product.price;

        renderRatingSection(product);

        // 3. Xử lý giá cũ và giảm giá (nếu có)
        const oldPriceEl = document.querySelector('.old-price');
        const discountEl = document.querySelector('.discount-tag');
        if (product.oldPrice) {
            if (oldPriceEl) oldPriceEl.innerText = product.oldPrice;
            if (discountEl) discountEl.innerText = product.discount;
        } else {
            if (oldPriceEl) oldPriceEl.style.display = 'none';
            if (discountEl) discountEl.style.display = 'none';
        }

        // 4. Đổ ảnh Thumbnails (ảnh nhỏ)
        const thumbContainer = document.querySelector('.thumbnail-list');
        if (thumbContainer && product.thumbnails) {
            thumbContainer.innerHTML = product.thumbnails.map(t =>
                `<img src="${t}" onclick="document.getElementById('main-img').src='${t}'" alt="thumb">`
            ).join('');
        }

        // 5. Đổ Màu sắc và Size (Mockup buttons)
        renderOptions('#color-options', product.colors || ["Mặc định"]);
        renderOptions('#size-options', product.sizes || ["Freesize"]);

        // 6. Đổ Mô tả sản phẩm
        const descBox = document.getElementById('p-desc');
        if (descBox && product.description) {
            descBox.innerHTML = Array.isArray(product.description)
                ? product.description.map(line => `<p>• ${line}</p>`).join('')
                : `<p>${product.description}</p>`;
        }

        // 7. Đổ Chính sách bảo quản
        const policyBox = document.getElementById('p-policy');
        if (policyBox && product.policy) {
            policyBox.innerHTML = product.policy.map(line => `<p>• ${line}</p>`).join('');
        }

    } else {
        console.error("Không tìm thấy sản phẩm với ID này");
    }
}

function renderOptions(selector, data) {
    const container = document.querySelector(selector);
    if (!container) return;

    // Xác định loại dựa trên selector
    const isColor = selector.includes('color');
    const type = isColor ? 'color' : 'size';
    const errorText = isColor ? 'Vui lòng chọn màu sắc' : 'Vui lòng chọn kích thước';

    // Đổ các nút bấm + Thêm thẻ lỗi đồng nhất
    container.innerHTML = data.map(item =>
        `<button class="opt-btn" onclick="selectOption(this)">${item}</button>`
    ).join('') + `<div id="${type}-error" class="error-msg" style="display:none; color:red; font-size:12px; margin-top:5px; font-style:italic;">${errorText}</div>`;
}

function selectOption(btn) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Tìm thẻ lỗi nằm ngay trong container này và ẩn đi
    const errorMsg = parent.querySelector('.error-msg');
    if (errorMsg) errorMsg.style.display = 'none';
}
/* ==========================================================
   4. GIỎ HÀNG & LOGIC
   ========================================================== */

function addToCart() {
    const params = new URLSearchParams(window.location.search);
    const productId = parseInt(params.get('id'));
    const product = products.find(p => p.id === productId);

    if (!product) return;

    const selectedColor = document.querySelector('#color-options .opt-btn.active');
    const selectedSize = document.querySelector('#size-options .opt-btn.active');
    const qtyInput = document.getElementById('qty');
    const quantity = qtyInput ? parseInt(qtyInput.value) : 1;

    let valid = true;

    // Kiểm tra màu sắc
    const colorError = document.getElementById('color-error');
    if (!selectedColor) {
        if (colorError) colorError.style.display = 'block';
        valid = false;
    }

    // Kiểm tra size
    const sizeError = document.getElementById('size-error');
    if (!selectedSize) {
        if (sizeError) sizeError.style.display = 'block';
        valid = false;
    }

    if (!valid) return;

    // Tạo object sản phẩm để lưu
    const cartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        img: product.img, // Lưu thêm ảnh để hiện ở trang giỏ hàng
        color: selectedColor.innerText,
        size: selectedSize.innerText,
        quantity: quantity
    };

    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Kiểm tra nếu sản phẩm đã tồn tại (cùng ID, cùng màu, cùng size)
    const existingProductIndex = cart.findIndex(item =>
        item.id === cartItem.id &&
        item.color === cartItem.color &&
        item.size === cartItem.size
    );

    if (existingProductIndex > -1) {
        cart[existingProductIndex].quantity += quantity;
    } else {
        cart.push(cartItem);
    }

    localStorage.setItem('cart', JSON.stringify(cart));

    showSuccessToast();

    updateCartCount();

    updateCartBadge();

    setTimeout(() => {
        window.location.href = "giohang.html";
    }, 800);
}

function showSuccessToast() {
    const toast = document.getElementById('cart-toast');
    if (toast) {
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 2000);
    }
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const badge = document.querySelector('.cart-count-badge');
    if (badge) badge.innerText = cart.length;
}

// Các hàm phụ trợ khác (Slider, Stars...) giữ nguyên cấu trúc đơn giản
function changeQty(val) {
    const input = document.getElementById('qty');
    let v = parseInt(input.value) + val;
    if (v >= 1) input.value = v;
}

// Hàm render phần đánh giá & tính toán sao
function renderRatingSection(p) {
    const container = document.querySelector('.rating-sold');
    if (!container) return;

    const starsHTML = generateStars(p.rating || 5);
    const soldFormatted = p.soldCount >= 1000 ? (p.soldCount / 1000).toFixed(1) + 'K' : (p.soldCount || 0);

    container.innerHTML = `
        <span class="rating-num">${p.rating || 5}</span>
        <div class="stars">${starsHTML}</div>
        <span class="divider">|</span>
        <span class="reviews">${p.reviewCount || 0} Đánh giá</span>
        <span class="divider">|</span>
        <span class="sold">${soldFormatted} Đã bán</span>
    `;
}

// Thuật toán vẽ sao (Full, Half, Empty)
function generateStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            html += '<i class="fa-solid fa-star" style="color: #ffcc00;"></i>';
        } else if (i - 0.5 <= rating) {
            html += '<i class="fa-solid fa-star-half-stroke" style="color: #ffcc00;"></i>';
        } else {
            html += '<i class="fa-regular fa-star" style="color: #ccc;"></i>';
        }
    }
    return html;
}

function renderCart() {
    const container = document.getElementById('cart-items-list');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:50px;">Giỏ hàng trống</div>`;
        const totalAmountEl = document.getElementById('cart-total-amount');
        if (totalAmountEl) totalAmountEl.innerText = "0đ";
        return;
    }

    container.innerHTML = cart.map((item, index) => {
        const priceNum = parseInt(item.price.replace(/\D/g, '')) || 0;
        const subtotal = priceNum * item.quantity;

        return `
            <div class="cart-item-row" data-index="${index}">
                <div style="text-align: center;">
                    <input type="checkbox" class="item-checkbox" onchange="updateTotalPrice()">
                </div>
                
                <div class="cart-item-info">
                    <img src="${item.img}" alt="${item.name}">
                    <p>${item.name}</p>
                </div>

                <div class="cart-item-type">
                    Màu: ${item.color} <br> Size: ${item.size}
                </div>

                <div class="qty-control">
                    <button onclick="updateCartQty(${index}, -1)">−</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartQty(${index}, 1)">+</button>
                </div>

                <div class="cart-item-price">
                    ${subtotal.toLocaleString('vi-VN')}đ
                </div>

                <div class="cart-item-action">
                    <span class="btn-delete" onclick="removeFromCart(${index})">Xóa</span>
                </div>
            </div>
        `;
    }).join('');

    // Sau khi render xong, ép tổng tiền về 0đ ngay lập tức
    const totalAmountEl = document.getElementById('cart-total-amount');
    if (totalAmountEl) totalAmountEl.innerText = "0đ";
}

// Hàm tăng giảm số lượng tại giỏ hàng
function updateCartQty(index, delta) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index].quantity + delta < 1) return;

    cart[index].quantity += delta;
    localStorage.setItem('cart', JSON.stringify(cart));

    const row = document.querySelector(`.cart-item-row[data-index="${index}"]`);
    if (row) {
        // Cập nhật số lượng hiển thị
        const qtySpan = row.querySelector('.qty-control span');
        if (qtySpan) qtySpan.innerText = cart[index].quantity;

        // Cập nhật thành tiền của riêng sản phẩm đó
        const priceNum = parseInt(cart[index].price.replace(/\D/g, '')) || 0;
        const subtotal = priceNum * cart[index].quantity;
        const subtotalEl = row.querySelector('.cart-item-price');
        if (subtotalEl) subtotalEl.innerText = subtotal.toLocaleString('vi-VN') + "đ";
    }

    updateCartBadge();

    updateTotalPrice();
}

// Hàm xóa sản phẩm khỏi giỏ
function removeFromCart(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateCartBadge();
}

// Gọi render khi load trang giỏ hàng
document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.includes("giohang.html")) {
        renderCart();
    }
});
function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const badge = document.getElementById('cart-count');
    if (!badge) return;

    if (totalItems <= 0) {
        badge.innerText = "0";
    } else if (totalItems > 9) {
        badge.innerText = "9+";
    } else {
        badge.innerText = totalItems;
    }
}

document.addEventListener("DOMContentLoaded", updateCartBadge);

//Hàm tính tổng tiền dựa trên checkbox
function updateTotalPrice() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    const rows = document.querySelectorAll('.cart-item-row');
    const totalAmountEl = document.getElementById('cart-total-amount');

    let totalSelected = 0;

    rows.forEach(row => {
        const checkbox = row.querySelector('.item-checkbox');

        if (checkbox && checkbox.checked) {
            const index = row.getAttribute('data-index');
            const item = cart[index];

            if (item) {

                const priceNum = parseInt(item.price.replace(/\D/g, '')) || 0;
                totalSelected += priceNum * item.quantity;
            }
        }
    });

    // Cập nhật con số hiển thị
    if (totalAmountEl) {
        totalAmountEl.innerText = totalSelected.toLocaleString('vi-VN') + "đ";
    }
}

//BOX THÔNG BÁO

// BOX THÔNG BÁO
// Cập nhật hàm để nhận thêm nội dung thông báo
function showModal(title, message) {
    const modal = document.getElementById('custom-alert');
    // Tìm các thẻ chứa tiêu đề và nội dung bên trong modal
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');

    if (modal) {
        // Nếu có truyền tham số thì mới thay đổi nội dung
        if (titleEl && title) titleEl.innerText = title;
        if (messageEl && message) messageEl.innerText = message;

        modal.style.display = 'flex';
    }
}

// Hàm đóng tb
function closeModal() {
    const modal = document.getElementById('custom-alert');
    if (modal) modal.style.display = 'none';
}
//////////////////


//////THANH TOÁN///////
function checkout() {
    const selectedCheckboxes = document.querySelectorAll('.item-checkbox:checked');

    //Kiểm tra nếu không có sản phẩm nào được chọn
    if (selectedCheckboxes.length === 0) {
        // Gọi hàm hiển thị Modal thông báo
        const modal = document.getElementById('custom-alert');
        if (modal) {
            modal.style.display = 'flex';
        }
        return;
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const selectedItems = [];

    selectedCheckboxes.forEach(checkbox => {
        const row = checkbox.closest('.cart-item-row');
        if (row) {
            const index = row.getAttribute('data-index');
            if (cart[index]) {
                selectedItems.push(cart[index]);
            }
        }
    });

    localStorage.setItem('checkoutItems', JSON.stringify(selectedItems));
    window.location.href = "thanhtoan.html";
}
