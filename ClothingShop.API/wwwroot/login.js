

//ĐĂNG NHẬP

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email_phone_value = document.getElementById('email_phone').value.trim();
        const password_value = document.getElementById('password').value.trim();

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailOrPhone: email_phone_value,
                    password: password_value
                })
            });

            const result = await response.json();

            if (response.ok && result.success) { 
                const data = result.data; 

                localStorage.setItem('accessToken', data.token);
                localStorage.setItem('userProfile', JSON.stringify(data));

               
                if (data.userId.startsWith("AD")) {
                    localStorage.setItem('userRole', 'Admin');
                    window.location.href = "admin.html";
                } else {
                    localStorage.setItem('userRole', 'Customer');
                    window.location.href = "index.html";
                }
            } else {
                showModal("Thất bại", result.message || "Đăng nhập không thành công.");
            }
        } catch (error) {
            showModal("Lỗi", "Không thể kết nối API.");
        }
    });
}


//ĐĂNG KÝ

const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const fullname = document.getElementById('fullname').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();

        if (password !== confirmPassword) {
            showModal("Lỗi", "Mật khẩu xác nhận không khớp!");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: fullname,
                    phoneNumber: phone,
                    email: email,
                    password: password,
                    role: "Customer" // Gửi yêu cầu role khách hàng
                })
            });

            if (response.ok) {
                showModal("Thành công", "Đăng ký tài khoản thành công!");
                setTimeout(() => { window.location.href = "login.html"; }, 1500);
            } else {
                const err = await response.json();
                showModal("Lỗi đăng ký", err.message || "Đăng ký thất bại.");
            }
        } catch (error) {
            showModal("Lỗi", "Không thể kết nối API.");
        }
    });
}