document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    const btn = document.getElementById('btnLogin');
    const err = document.getElementById('errorMsg');

    btn.textContent = 'Memverifikasi...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: u, password: p })
        });
        const data = await res.json();
        
        if (data.success) {
            window.location.href = '/admin.html';
        } else {
            err.style.display = 'block';
            err.textContent = data.message || 'Login gagal';
            btn.innerHTML = 'Masuk Dasbor <i class="fa-solid fa-arrow-right"></i>';
            btn.disabled = false;
        }
    } catch (e) {
        err.style.display = 'block';
        err.textContent = 'Tidak dapat menghubungi server.';
        btn.innerHTML = 'Masuk Dasbor <i class="fa-solid fa-arrow-right"></i>';
        btn.disabled = false;
    }
});
