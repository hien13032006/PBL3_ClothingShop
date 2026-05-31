// =========================================================================
// 1. KHỞI TẠO DỮ LIỆU MẪU (LOCALSTORAGE)
// =========================================================================
const initialProducts = [
    { id: "SP001", name: "Áo babydoll ROSE", description: "Áo babydoll dễ thương dáng rộng", category: "ao", gender: "nu", colors: ["Trắng", "Kem"], sizes: ["S", "M"], price: 169000, stock: 15, img: "images/a1.jpg" },
    { id: "SP002", name: "Quần jeans nu basic", description: "Quần jeans nữ chất bò dày dặn", category: "quan", gender: "nu", colors: ["Xanh"], sizes: ["M", "L"], price: 209000, stock: 5, img: "images/a3.jpg" },
    { id: "SP003", name: "Áo sơ mi nam tay dài dễ phối", description: "Sơ mi lụa mềm mịn, đứng dáng", category: "ao", gender: "nam", colors: ["Đen", "Trắng"], sizes: ["M", "L", "XL"], price: 120000, stock: 0, img: "images/a2.jpg" },
    { id: "SP004", name: "Bộ đồ bé trai", description: "Đồ bộ chất cotton co giãn cho trẻ em", category: "ao", gender: "treem", colors: ["Xám", "Xanh"], sizes: ["S"], price: 150000, stock: 10, img: "images/a4.jpg" }
];

if (!localStorage.getItem('products')) {
    localStorage.setItem('products', JSON.stringify(initialProducts));
}

let currentGenderFilter = 'all';

// =========================================================================
// 2. HÀM HIỂN THỊ DANH SÁCH SẢN PHẨM RA BẢNG (RENDER HTML)
// =========================================================================
function renderProducts(list) {
    const tbody = document.getElementById('product-list');
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">Không tìm thấy sản phẩm phù hợp.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(p => {
        const categoryMap = {
            'ao': 'ÁO',
            'quan': 'QUẦN',
            'vay': 'VÁY/ĐẦM'
        };
        const categoryDisplay = categoryMap[p.category] || p.category.toUpperCase();

        return `
        <tr>
            <td>
                <img src="${p.img}" 
                     onerror="this.src='https://via.placeholder.com/50'" 
                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #eee;">
            </td>
            <td style="font-weight: bold;">${p.name}</td>
            <td>${categoryDisplay}</td> 
            <td>${p.price.toLocaleString()}₫</td>
            <td>
                <span class="badge ${p.stock > 0 ? 'badge-shipping' : 'badge-cancelled'}">
                    ${p.stock > 0 ? 'Còn ' + p.stock : 'Hết hàng'}
                </span>
            </td>
            <td>
                <button class="btn-edit" onclick="editProduct('${p.id}')" title="Sửa"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-delete" onclick="deleteProduct('${p.id}')" title="Xóa"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `;
    }).join('');
}

// =========================================================================
// 3. LOGIC LỌC TỔNG HỢP VÀ TÌM KIẾM (SEARCH + FILTER TABS)
// =========================================================================
window.filterByGender = function (gender, el) {
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    el.classList.add('active');

    currentGenderFilter = gender;
    handleFilter();
};

window.handleFilter = function () {
    const keyword = document.getElementById('product-search').value.toLowerCase();
    const allProducts = JSON.parse(localStorage.getItem('products')) || [];

    const filtered = allProducts.filter(p => {
        let matchTab = false;
        if (currentGenderFilter === 'all') {
            matchTab = true;
        } else if (currentGenderFilter === 'out-of-stock') {
            matchTab = (p.stock === 0);
        } else {
            matchTab = (p.gender === currentGenderFilter);
        }

        const matchKey = p.name.toLowerCase().includes(keyword) || p.id.toLowerCase().includes(keyword);

        return matchTab && matchKey;
    });

    renderProducts(filtered);
};

// =========================================================================
// 4. HÀM TỰ ĐỘNG SINH MÃ SẢN PHẨM TĂNG DẦN (SP001, SP002,...)
// =========================================================================
function generateNextProductId() {
    const allProducts = JSON.parse(localStorage.getItem('products')) || [];
    if (allProducts.length === 0) return "SP001";

    const lastIds = allProducts.map(p => {
        const idNumber = parseInt(p.id.replace("SP", ""));
        return isNaN(idNumber) ? 0 : idNumber;
    });

    const maxId = Math.max(...lastIds);
    return "SP" + String(maxId + 1).padStart(3, '0');
}

// =========================================================================
// 5. ĐÓNG / MỞ VÀ RESET DIALOG (MODAL THÊM SẢN PHẨM)
// =========================================================================
window.openAddModal = function () {
    document.getElementById('product-modal').style.display = 'flex';
    document.getElementById('modal-title').innerText = "Thêm Sản Phẩm Mới";
    document.getElementById('form-mode').value = "add"; // Chuyển form sang trạng thái THÊM

    const nextIdInput = document.getElementById('new-id');
    if (nextIdInput) {
        nextIdInput.value = generateNextProductId();
    }
};

window.closeModal = function () {
    document.getElementById('product-modal').style.display = 'none';
    const addForm = document.getElementById('add-product-form');
    if (addForm) {
        addForm.reset();
        // Xóa sạch trạng thái tick của checkbox khi đóng form
        document.querySelectorAll('input[name="new-colors"], input[name="new-sizes"]').forEach(cb => cb.checked = false);
    }
};

// =========================================================================
// 6. XỬ LÝ CHỈNH SỬA SẢN PHẨM (ĐỔ DỮ LIỆU CŨ VÀO FORM)
// =========================================================================
window.editProduct = function (id) {
    const allProducts = JSON.parse(localStorage.getItem('products')) || [];
    const product = allProducts.find(p => p.id === id);

    if (!product) {
        alert("Không tìm thấy thông tin sản phẩm!");
        return;
    }

    // 1. Mở modal và thiết lập trạng thái SỬA
    document.getElementById('product-modal').style.display = 'flex';
    document.getElementById('modal-title').innerText = "Chỉnh Sửa Sản Phẩm";
    document.getElementById('form-mode').value = "edit";

    // 2. Điền các thông tin text/select cơ bản
    document.getElementById('new-id').value = product.id;
    document.getElementById('new-name').value = product.name;
    document.getElementById('new-description').value = product.description || "";
    document.getElementById('new-category').value = product.category === "áo" ? "ao" : product.category;
    document.getElementById('new-gender').value = product.gender;
    document.getElementById('new-price').value = product.price;
    document.getElementById('new-stock').value = product.stock;
    document.getElementById('new-img').value = product.img === "images/default.jpg" ? "" : product.img;

    // 3. Đổ dữ liệu Checkbox Màu sắc (Đã sửa từ Array.of thành Array.isArray)
    document.querySelectorAll('input[name="new-colors"]').forEach(cb => {
        cb.checked = product.colors && Array.isArray(product.colors) && product.colors.includes(cb.value);
    });

    // 4. Đổ dữ liệu Checkbox Kích cỡ (Đã sửa từ Array.of thành Array.isArray)
    document.querySelectorAll('input[name="new-sizes"]').forEach(cb => {
        cb.checked = product.sizes && Array.isArray(product.sizes) && product.sizes.includes(cb.value);
    });
};
// =========================================================================
// 7. KHỞI TẠO CÁC SỰ KIỆN KHI TẢI TRANG (DOM CONTENT LOADED)
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Luôn hiển thị dữ liệu từ LocalStorage khi nạp trang
    const currentData = JSON.parse(localStorage.getItem('products')) || initialProducts;
    renderProducts(currentData);

    // Sự kiện tìm kiếm real-time
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.addEventListener('input', handleFilter);
    }

    // Xử lý sự kiện Submit Form (Xử lý cả Thêm và Sửa)
    const addForm = document.getElementById('add-product-form');
    if (addForm) {
        addForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const mode = document.getElementById('form-mode').value;
            const productId = document.getElementById('new-id').value;

            // Lấy danh sách các Màu và Size được check
            const checkedColors = Array.from(document.querySelectorAll('input[name="new-colors"]:checked')).map(cb => cb.value);
            const checkedSizes = Array.from(document.querySelectorAll('input[name="new-sizes"]:checked')).map(cb => cb.value);

            // Thu thập dữ liệu từ các input trường
            const productData = {
                id: productId,
                name: document.getElementById('new-name').value.trim(),
                description: document.getElementById('new-description').value.trim() || "Chưa có mô tả.",
                category: document.getElementById('new-category').value,
                gender: document.getElementById('new-gender').value,
                colors: checkedColors,
                sizes: checkedSizes,
                price: parseInt(document.getElementById('new-price').value) || 0,
                stock: parseInt(document.getElementById('new-stock').value) || 0,
                img: document.getElementById('new-img').value.trim() || "images/default.jpg"
            };

            let allProducts = JSON.parse(localStorage.getItem('products')) || [];

            if (mode === "add") {
                // Xử lý logic THÊM MỚI
                if (allProducts.some(p => p.id === productData.id)) {
                    alert("Mã sản phẩm này đã tồn tại! Hệ thống sẽ cập nhật lại mã mới.");
                    document.getElementById('new-id').value = generateNextProductId();
                    return;
                }
                allProducts.push(productData);
                alert("Thêm sản phẩm mới thành công!");

            } else if (mode === "edit") {
                // Xử lý logic CẬP NHẬT (SỬA)
                const index = allProducts.findIndex(p => p.id === productId);
                if (index !== -1) {
                    allProducts[index] = productData;
                    alert("Cập nhật thông tin sản phẩm thành công!");
                } else {
                    alert("Có lỗi xảy ra, không tìm thấy sản phẩm cần sửa!");
                    return;
                }
            }

            // Lưu dữ liệu vào mảng và cập nhật lại giao diện
            localStorage.setItem('products', JSON.stringify(allProducts));
            handleFilter();
            closeModal();
        });
    }
});

// =========================================================================
// 8. XÓA SẢN PHẨM
// =========================================================================
function deleteProduct(id) {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
        let all = JSON.parse(localStorage.getItem('products')) || [];
        all = all.filter(p => p.id !== id);
        localStorage.setItem('products', JSON.stringify(all));
        handleFilter(); // Tải lại danh sách sau khi xóa
    }
}