// 1. Khởi tạo dữ liệu giả lập (Chỉ chạy nếu chưa có dữ liệu)
(function initMockData() {
    const existingUsers = localStorage.getItem('usersList');
    if (!existingUsers) {
        const mockUsers = [
            {
                fullname: "Lê Thị Hiền",
                phone: "0123456789",
                email: "user@gmail.com",
                password: "123",
                username: "hienle2k4",
                gender: "nu"
            }
        ];
        localStorage.setItem('usersList', JSON.stringify(mockUsers));
    }
})();

// 2. Xử lý sự kiện Đăng nhập
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const email_phone = document.getElementById('email_phone').value.trim();
        const password = document.getElementById('password').value.trim();

        if (email_phone === "" || password === "") {
            showModal("Thiếu thông tin", "Vui lòng nhập đầy đủ Email/SĐT và mật khẩu!");
            return;
        }

        const users = JSON.parse(localStorage.getItem('usersList')) || [];
        const userFound = users.find(u => 
            (u.email === email_phone || u.phone === email_phone) && u.password === password
        );

        if (userFound) {
            localStorage.setItem('user', JSON.stringify({
                ...userFound,
                isLoggedIn: true
            }));
            window.location.href = "index.html"; 
        } else {
            showModal("Đăng nhập thất bại", "Tài khoản hoặc mật khẩu không chính xác.");
        }
    });
}


//ĐĂNG KÝ?///////////
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const fullname = document.getElementById('fullname').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();

        if (password !== confirmPassword) {
            showModal("Lỗi xác nhận", "Mật khẩu xác nhận không khớp!");
            return;
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            showModal("Lỗi định dạng", "Số điện thoại phải có đúng 10 chữ số!");
            return;
        }

        let users = JSON.parse(localStorage.getItem('usersList')) || [];
        if (users.some(user => user.phone === phone)) {
            showModal("Lỗi đăng ký", "Số điện thoại này đã được sử dụng!");
            return;
        }

        const newUser = {
            fullname: fullname,
            phone: phone,
            email: email || "Chưa cung cấp",
            password: password
        };

        users.push(newUser);
        localStorage.setItem('usersList', JSON.stringify(users));

        // Lưu ý: Có thể dùng showModal ở đây rồi mới chuyển trang, 
        // nhưng chuyển thẳng về login như bạn làm là nhanh nhất.
        window.location.href = "login.html";
    });
}