const ocrForm = document.getElementById('ocrForm');
const ocrFileInput = document.getElementById('ocrFileInput');
const ocrButton = document.getElementById('ocrButton');
const ocrMessage = document.getElementById('ocr-message');
const fileListContainer = document.getElementById('fileList');
const form = document.getElementById('uploadForm');
const fileInput = document.getElementById('excelfile');
const uploadBtn = document.getElementById('upload-btn');
const message = document.getElementById('message');
const progressBar = document.getElementById('progress-bar');
const fileList = document.querySelector('.file-list');
const createTableBtn = document.getElementById('create-table-btn');
const createTableMessage = document.getElementById('create-table-message');
const createscrapingocrtablemessage = document.getElementById('create-scraping-ocr-table-message');
const scrapeMessage = document.getElementById('scrape-message');
const urlInput = document.getElementById('url');

const createScrapingOcrTableBtn = document.getElementById('createScrapingOcrTableBtn');

const scrapeForm = document.getElementById('scrapeForm');

scrapeForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const url = document.getElementById('url').value;

    try {
        const response = await fetch('/scrape', {
            method: 'POST', headers: {
                'Content-Type': 'application/json',
            }, body: JSON.stringify({url}),
        });

        const data = await response.json();
        urlInput.value = '';
        scrapeMessage.textContent = 'Scraping realizado con éxito';


    } catch (error) {
        scrapeMessage.textContent = 'Error de conexión al servidor';
    }
});

createScrapingOcrTableBtn.addEventListener('click', () => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/create-scraping-ocr-table', true);


    xhr.onload = () => {
        if (xhr.status === 200) {

            const progress = Math.round((event.loaded / event.total) * 100);
            /*  progressBar.style.width = `${progress}%`;
              progressBar.textContent = `${progress}%`;*/
            createscrapingocrtablemessage.textContent = 'Tabla "scraping_ocr_dengue" creada';
        } else {
            createscrapingocrtablemessage.textContent = 'Error al crear la tabla:';
        }
    };

    xhr.send();
});

createTableBtn.addEventListener('click', () => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/create-table', true);


    xhr.onload = () => {
        if (xhr.status === 200) {

            const progress = Math.round((event.loaded / event.total) * 100);
            progressBar.style.width = `${progress}%`;
            progressBar.textContent = `${progress}%`;
            createTableMessage.textContent = 'Tabla "dengue" creada con éxito';
        } else {
            createTableMessage.textContent = 'Error al crear la tabla "dengue"';
        }
    };

    xhr.send();
});

// Deshabilitar el botón de subida inicialmente
uploadBtn.disabled = true;

// Validar la selección de archivos
fileInput.addEventListener('change', () => {
    const files = fileInput.files;
    fileList.innerHTML = '';

    if (files.length > 0) {
        uploadBtn.disabled = false;
        message.textContent = '';
        createTableMessage.textContent = '';
        progressBar.style.width = '10%';
        progressBar.textContent = '10%';

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.name.endsWith('.xlsx')) {
                const li = document.createElement('li');
                li.innerHTML = `<i class="fas fa-file-excel"></i> ${file.name}`;
                fileList.appendChild(li);
            } else {
                message.textContent = 'Por favor, seleccione archivos Excel válidos.';
                progressBar.style.width = '0%';
                progressBar.textContent = '0%';
                uploadBtn.disabled = true;
            }
        }
    } else {
        uploadBtn.disabled = true;
        message.textContent = '';
    }
});

// Subir archivos al servidor
uploadBtn.addEventListener('click', () => {
    const files = fileInput.files;
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
        formData.append('excelfiles', files[i]);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/upload', true);

    xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            progressBar.style.width = `${progress}%`;
            progressBar.textContent = `${progress}%`;
        }
    };

    xhr.onload = () => {
        if (xhr.status === 200) {
            message.textContent = 'Archivos Excel cargados con éxito';
            fileInput.value = ''; // Limpiar el input de archivo
            fileList.innerHTML = ''; // Limpiar la lista de archivos
            uploadBtn.disabled = true;
        } else {
            message.textContent = 'Error al cargar los archivos Excel';
        }
    };

    xhr.send(formData);
});

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
            method: 'POST', body: formData,
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

