const ocrForm = document.getElementById('ocrForm');
const ocrFileInput = document.getElementById('ocrFileInput');
const ocrButton = document.getElementById('ocrButton');
const ocrMessage = document.getElementById('ocr-message');
const fileListContainer = document.getElementById('fileList');

ocrFileInput.addEventListener('change', () => {
    fileListContainer.innerHTML = ''; // Limpiar la lista antes de agregar el nuevo archivo

    const file = ocrFileInput.files[0];
    if (file) {
        const li = document.createElement('li');
        li.textContent = file.name;
        fileListContainer.appendChild(li);
    }
});

ocrForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const file = ocrFileInput.files[0];

    if (!file) {
        ocrMessage.textContent = 'Por favor, seleccione un archivo de imagen';
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/ocr', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (data.success) {
            ocrMessage.textContent = data.message;
        } else {
            ocrMessage.textContent = `Error al realizar OCR: ${data.error}`;
        }
    } catch (error) {
        console.error('Error al realizar OCR:', error);
        ocrMessage.textContent = 'Error al realizar OCR';
    }
});