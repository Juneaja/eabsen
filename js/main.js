document.addEventListener('DOMContentLoaded', function() {
    console.log('Main JS loaded');
    
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
});

async function handleLogin(e) {
    e.preventDefault();
    console.log('Login attempt');
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    
    // Validasi
    if (!email || !password) {
        showAlert('Email dan password wajib diisi!', 'error');
        return;
    }
    
    // Disable button
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Login...';
    btn.disabled = true;
    
    try {
        console.log('Sending login request...');
        const response = await fetch('php/auth.php', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                action: 'login', 
                email: email, 
                password: password, 
                role: role 
            })
        });
        
        const result = await response.json();
        console.log('Login response:', result);
        
        if (result.success) {
            // Simpan user data
            localStorage.setItem('user', JSON.stringify(result.user));
            showAlert('Login berhasil!', 'success');
            
            // Redirect
            setTimeout(() => {
                if (result.user.role === 'admin' || email.includes('@admin')) {
                    window.location.href = 'admin/index.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 1000);
            
        } else {
            showAlert(result.message || 'Login gagal', 'error');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Error koneksi: ' + error.message, 'error');
    } finally {
        // Re-enable button
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    console.log('Signup attempt');
    
    const nama = document.getElementById('nama').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    
    // Validasi
    if (!nama || !email || !password) {
        showAlert('Semua field wajib diisi!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password minimal 6 karakter!', 'error');
        return;
    }
    
    // Disable button
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Mendaftar...';
    btn.disabled = true;
    
    try {
        const response = await fetch('php/auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'signup', 
                nama, 
                email, 
                password 
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert(result.message, 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showAlert(result.message, 'error');
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        showAlert('Error koneksi: ' + error.message, 'error');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function showAlert(message, type = 'info') {
    // Hapus alert sebelumnya
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alert = document.createElement('div');
    alert.className = `custom-alert alert-${type}`;
    alert.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        padding: 15px 25px; border-radius: 10px; color: white; font-weight: bold;
        z-index: 10000; max-width: 90%; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    const bgColor = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8';
    alert.style.backgroundColor = bgColor;
    
    alert.textContent = message;
    document.body.appendChild(alert);
    
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 4000);
}

function logout() {
    if (confirm('Yakin ingin logout?')) {
        localStorage.removeItem('user');
        sessionStorage.clear();
        window.location.href = 'index.html';
    }
}

// Export global functions
window.logout = logout;
window.showAlert = showAlert;
