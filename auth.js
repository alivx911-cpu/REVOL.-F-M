// تسجيل الدخول
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'dashboard.html';
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('خطأ في الاتصال بالخادم');
    }
});

// إنشاء حساب
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('كلمة المرور غير متطابقة');
        return;
    }
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن');
            window.location.href = 'index.html';
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('خطأ في الاتصال بالخادم');
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

window.addEventListener('load', () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const usernameEl = document.getElementById('username');
    if (usernameEl && user.username) {
        usernameEl.textContent = `مرحباً ${user.username}`;
    }
});