document.addEventListener('DOMContentLoaded', () => {
    const importForm = document.getElementById('importForm');
    const messageDiv = document.getElementById('message');

    if (importForm) {
        importForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            messageDiv.textContent = ''; // Clear previous messages

            const excelFile = document.getElementById('excelFile').files[0];
            if (!excelFile) {
                messageDiv.textContent = 'Please select an Excel file to upload.';
                messageDiv.style.color = 'red';
                return;
            }

            const formData = new FormData();
            formData.append('excelFile', excelFile);

            try {
                const token = localStorage.getItem('adminToken');
                if (!token) {
                    messageDiv.textContent = 'Authentication token not found. Please log in.';
                    messageDiv.style.color = 'red';
                    setTimeout(() => { window.location.href = '/admin/login.html'; }, 1500);
                    return;
                }

                messageDiv.textContent = 'Uploading and importing items...';
                messageDiv.style.color = 'blue';

                const response = await fetch('/api/items/import', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const data = await response.json();

                if (response.ok) {
                    messageDiv.textContent = data.message || 'Items imported successfully!';
                    messageDiv.style.color = 'green';
                    importForm.reset(); // Clear the file input
                } else {
                    messageDiv.textContent = data.message || 'Failed to import items.';
                    messageDiv.style.color = 'red';
                }
            } catch (error) {
                console.error('Error during item import:', error);
                messageDiv.textContent = 'An error occurred during the import process.';
                messageDiv.style.color = 'red';
            }
        });
    }
}); 