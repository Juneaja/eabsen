document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;

            try {
                const response = await fetch('php/auth.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'login', email, password, role })
                });

                const result = await response.json();
                
                if (result.success) {
                    localStorage.setItem('user', JSON.stringify(result.user));
                    if (role === 'admin') {
                        window.location.href = 'admin/index.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    alert(result.message);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const nama = document.getElementById('nama').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;

            try {
                const response = await fetch('php/auth.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'signup', nama, email, password })
                });

                const result = await response.json();
                if (result.success) {
                    alert('Registrasi berhasil! Silakan login.');
                    window.location.href = 'index.html';
                } else {
                    alert(result.message);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    }
});

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}
