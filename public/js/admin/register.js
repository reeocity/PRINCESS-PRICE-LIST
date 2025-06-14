document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Registration successful! You can now log in.');
                window.location.href = 'login.html';
            } else {
                alert(data.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            alert('An error occurred. Please try again later.');
            console.error(error);
        }
    });
}); 