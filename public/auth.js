async function getCsrfToken() {
    const res = await fetch('/api/csrf-token');
    if (!res.ok) throw new Error('csrf');
    const data = await res.json();
    return data.csrfToken;
}

document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tab.getAttribute('data-target')).classList.add('active');
        });
    });

    // Handle Login
    document.getElementById('formLogin').addEventListener('submit', async (e) => {
        e.preventDefault();
        const contact = document.getElementById('logContact').value;
        const password = document.getElementById('logPassword').value;
        const err = document.getElementById('logError');
        const btn = document.getElementById('btnLogSubmit');

        err.style.display = 'none';
        btn.textContent = 'Memverifikasi...';
        btn.disabled = true;

        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch('/api/customer/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
                body: JSON.stringify({ contact, password })
            });
            const data = await res.json();
            
            if (data.success) {
                // Determine origin or go to menu
                const urlParams = new URLSearchParams(window.location.search);
                const redirect = urlParams.get('redirect') || '/menu.html';
                window.location.href = redirect;
            } else {
                err.style.display = 'block';
                err.textContent = data.message || 'Gagal masuk. Periksa kembali data Anda.';
            }
        } catch (e) {
            err.style.display = 'block';
            err.textContent = 'Tidak dapat terhubung ke server.';
        } finally {
            if(err.style.display === 'block') {
                btn.innerHTML = 'Masuk <i class="fa-solid fa-arrow-right"></i>';
                btn.disabled = false;
            }
        }
    });

    // Handle Register
    document.getElementById('formRegister').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const contact = document.getElementById('regContact').value;
        const password = document.getElementById('regPassword').value;
        const err = document.getElementById('regError');
        const btn = document.getElementById('btnRegSubmit');

        err.style.display = 'none';
        btn.textContent = 'Mendaftarkan...';
        btn.disabled = true;

        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch('/api/customer/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
                body: JSON.stringify({ name, contact, password })
            });
            const data = await res.json();
            
            if (data.success) {
                const urlParams = new URLSearchParams(window.location.search);
                const redirect = urlParams.get('redirect') || '/menu.html';
                window.location.href = redirect;
            } else {
                err.style.display = 'block';
                err.textContent = data.message || 'Pendaftaran gagal.';
            }
        } catch (e) {
            err.style.display = 'block';
            err.textContent = 'Tidak dapat terhubung ke server.';
        } finally {
            if(err.style.display === 'block') {
                btn.innerHTML = 'Daftar Akun <i class="fa-solid fa-user-plus"></i>';
                btn.disabled = false;
            }
        }
    });
});
