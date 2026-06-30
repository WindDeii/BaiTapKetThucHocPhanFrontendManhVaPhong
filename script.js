const API_URL = 'https://6a40c3771ff1d27becc0f41c.mockapi.io/products';
let allProducts = []; 

document.addEventListener('DOMContentLoaded', () => {
    // Kích hoạt hàm cho Trang Chủ
    if (document.getElementById('product-container')) {
        loadHomeData();
        updateCartUI();
        
        document.getElementById('searchInput').addEventListener('input', filterHomeProducts);
        document.getElementById('categoryFilter').addEventListener('change', filterHomeProducts);
    }
    
    // Kích hoạt hàm cho Trang Admin
    if (document.getElementById('admin-product-list')) {
        loadAdminData();
        document.getElementById('adminSearchInput').addEventListener('input', filterAdminProducts);
    }
});

/* ==========================================
   LOGIC TRANG CHỦ: HIỂN THỊ, LỌC & TÌM KIẾM
========================================== */
async function loadHomeData() {
    try {
        const res = await fetch(API_URL);
        allProducts = await res.json();
        document.getElementById('loader').style.display = 'none';
        renderHomeProducts(allProducts);
    } catch (err) {
        document.getElementById('loader').innerHTML = '<p class="text-danger fw-bold">Lỗi kết nối máy chủ API!</p>';
    }
}

function renderHomeProducts(products) {
    const container = document.getElementById('product-container');
    if(products.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted py-5"><h5>Không tìm thấy sản phẩm nào.</h5></div>';
        return;
    }
    
    container.innerHTML = products.map(p => `
        <div class="col-12 col-md-6 col-lg-3">
            <div class="product-card h-100 d-flex flex-column p-3">
                <img src="${p.image}" class="card-img-top mb-3" alt="${p.name}" onerror="this.src='https://via.placeholder.com/280x280?text=No+Image'">
                <div class="d-flex flex-column justify-content-between flex-grow-1">
                    <div>
                        <h6 class="fw-bold mb-2 text-dark" style="line-height: 1.4;">${p.name}</h6>
                        <p class="text-danger fw-bold fs-5 mb-3">${Number(p.price).toLocaleString('vi-VN')} đ</p>
                    </div>
                    <button class="btn btn-dark w-100 fw-medium rounded-1" onclick="addToCart('${p.id}', '${p.name}', ${p.price}, '${p.image}')">
                        Thêm Vào Giỏ
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterHomeProducts() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value.toLowerCase();

    const filtered = allProducts.filter(p => {
        const matchName = p.name.toLowerCase().includes(searchText);
        const matchCategory = category === 'all' || p.name.toLowerCase().includes(category);
        return matchName && matchCategory;
    });

    renderHomeProducts(filtered);
}

/* ==========================================
   LOGIC GIỎ HÀNG (Local Storage)
========================================== */
function addToCart(id, name, price, image) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, image, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    
    const toastEl = document.getElementById('liveToast');
    if(toastEl) {
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    } else {
        alert("Đã thêm vào giỏ hàng!");
    }
}

function updateCartUI() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    document.getElementById('cart-count').innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartItems = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    let total = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="text-center text-muted py-4">Giỏ hàng của bạn đang trống</div>';
        totalEl.innerText = '0';
        return;
    }

    cartItems.innerHTML = cart.map(item => {
        let itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-3">
                <div class="d-flex align-items-center gap-3">
                    <img src="${item.image}" class="img-thumbnail-custom" onerror="this.src='https://via.placeholder.com/60x60'">
                    <div>
                        <h6 class="mb-1 fw-bold text-dark">${item.name}</h6>
                        <span class="badge bg-secondary">SL: ${item.quantity}</span>
                    </div>
                </div>
                <div class="text-end">
                    <span class="text-danger fw-bold d-block mb-1">${Number(itemTotal).toLocaleString('vi-VN')} đ</span>
                    <button class="btn btn-sm btn-outline-danger px-2 py-1" onclick="removeFromCart('${item.id}')">
                        <i class="bi bi-trash"></i> Xóa
                    </button>
                </div>
            </div>`;
    }).join('');
    totalEl.innerText = Number(total).toLocaleString('vi-VN');
}

function removeFromCart(id) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

/* ==========================================
   LOGIC TRANG ADMIN (CRUD + Xóa Hàng Loạt)
========================================== */
async function loadAdminData() {
    try {
        const res = await fetch(API_URL);
        allProducts = await res.json();
        renderAdminProducts(allProducts);
    } catch (err) {
        document.getElementById('admin-product-list').innerHTML = '<tr><td colspan="5" class="text-danger py-4 text-center">Lỗi kết nối máy chủ!</td></tr>';
    }
}

function renderAdminProducts(products) {
    const tbody = document.getElementById('admin-product-list');
    
    if(products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-5 text-center text-muted">Không có sản phẩm nào.</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(p => `
        <tr>
            <td class="text-center"><span class="id-badge">#${p.id}</span></td>
            <td class="text-center">
                <div class="d-inline-block border rounded" style="width: 56px; height: 56px; overflow: hidden; background: #fff; padding: 2px;">
                    <img src="${p.image}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" onerror="this.src='https://via.placeholder.com/50x50?text=IMG'">
                </div>
            </td>
            <td class="text-start"><span class="fw-bold" style="color: #0f172a; font-size: 1.05rem;">${p.name}</span></td>
            <td class="text-center"><span class="text-danger fw-bold" style="font-size: 1.1rem;">${Number(p.price).toLocaleString('vi-VN')} đ</span></td>
            <td class="text-center align-middle">
                <button class="btn text-white fw-medium btn-action px-3 py-1 me-2" style="background-color: #f59e0b;" onclick="openEditModal('${p.id}')">Sửa</button>
                <button class="btn text-white fw-medium btn-action px-3 py-1 me-3" style="background-color: #ef4444;" onclick="deleteProduct('${p.id}')">Xóa</button>
                <input class="form-check-input product-checkbox" type="checkbox" value="${p.id}" onchange="updateBulkDeleteButton()" style="width: 1.3rem; height: 1.3rem; cursor: pointer; vertical-align: middle;">
            </td>
        </tr>
    `).join('');
    
    document.getElementById('selectAllCheckbox').checked = false;
    updateBulkDeleteButton();
}

function filterAdminProducts() {
    const text = document.getElementById('adminSearchInput').value.toLowerCase();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(text) || p.id.toString().includes(text));
    renderAdminProducts(filtered);
}

// ---- Logic Chọn & Xóa Nhiều ----
function toggleSelectAll(source) {
    const checkboxes = document.querySelectorAll('.product-checkbox');
    checkboxes.forEach(cb => cb.checked = source.checked);
    updateBulkDeleteButton();
}

function updateBulkDeleteButton() {
    const checkedBoxes = document.querySelectorAll('.product-checkbox:checked');
    const btnBulkDelete = document.getElementById('btnBulkDelete');
    const selectedCount = document.getElementById('selectedCount');
    
    if (checkedBoxes.length > 0) {
        btnBulkDelete.style.display = 'inline-block';
        selectedCount.innerText = checkedBoxes.length;
    } else {
        btnBulkDelete.style.display = 'none';
        document.getElementById('selectAllCheckbox').checked = false;
    }
}

async function deleteSelectedProducts() {
    const checkedBoxes = document.querySelectorAll('.product-checkbox:checked');
    if (checkedBoxes.length === 0) return;

    if (confirm(`Bạn có chắc chắn muốn xóa ${checkedBoxes.length} sản phẩm đã chọn không?`)) {
        const idsToDelete = Array.from(checkedBoxes).map(cb => cb.value);
        const btn = document.getElementById('btnBulkDelete');
        
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang xóa...';

        try {
            await Promise.all(idsToDelete.map(id => fetch(`${API_URL}/${id}`, { method: 'DELETE' })));
            alert(`Đã xóa thành công ${checkedBoxes.length} sản phẩm!`);
            loadAdminData();
        } catch (err) {
            alert("Lỗi mạng! Không thể xóa một số sản phẩm.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-trash3 me-1"></i> Xóa Đã Chọn (<span id="selectedCount">0</span>)';
        }
    }
}

// ---- Mở Modal ----
function openProductModal() {
    document.getElementById('modalTitle').innerText = 'Thêm Sản Phẩm Mới';
    document.getElementById('prodId').value = '';
    document.getElementById('prodName').value = '';
    document.getElementById('prodPrice').value = '';
    document.getElementById('prodImage').value = '';
    document.getElementById('saveBtn').innerHTML = 'Lưu Sản Phẩm';
    new bootstrap.Modal(document.getElementById('productModal')).show();
}

function openEditModal(id) {
    const p = allProducts.find(item => item.id === id);
    if (!p) return;
    
    document.getElementById('modalTitle').innerText = 'Chỉnh Sửa Sản Phẩm';
    document.getElementById('prodId').value = p.id;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodImage').value = p.image;
    document.getElementById('saveBtn').innerHTML = 'Lưu Thay Đổi';
    new bootstrap.Modal(document.getElementById('productModal')).show();
}

// ---- Gọi API Lưu & Xóa Lẻ ----
async function saveProduct() {
    const id = document.getElementById('prodId').value;
    const name = document.getElementById('prodName').value.trim();
    const price = document.getElementById('prodPrice').value;
    const image = document.getElementById('prodImage').value.trim();
    const btn = document.getElementById('saveBtn');

    if (!name || !price || !image) {
        alert("Vui lòng nhập đầy đủ thông tin!");
        return;
    }

    const payload = { name, price: Number(price), image };
    btn.disabled = true;
    btn.innerHTML = 'Đang xử lý...';
    
    try {
        if (id) {
            await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
        } else {
            await fetch(API_URL, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
        }
        bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
        loadAdminData(); 
    } catch (err) {
        alert("Lỗi mạng! Không thể lưu dữ liệu.");
    } finally {
        btn.disabled = false;
    }
}

async function deleteProduct(id) {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này không? Dữ liệu sẽ mất vĩnh viễn.")) {
        try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            loadAdminData();
        } catch (err) {
            alert("Lỗi khi xóa sản phẩm!");
        }
    }
}