const form = document.getElementById('uploadForm');
const fileInput = document.getElementById('excelfile');
const uploadBtn = document.getElementById('upload-btn');
const message = document.getElementById('message');
const progressBar = document.getElementById('progress-bar');
const fileList = document.querySelector('.file-list');
// Agregar función para crear la tabla "epidemia"
const createTableBtn = document.getElementById('create-table-btn');
const createTableMessage = document.getElementById('create-table-message');

createTableBtn.addEventListener('click', () => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/create-table', true);


    xhr.onload = () => {
        if (xhr.status === 200) {

            const progress = Math.round((event.loaded / event.total) * 100);
            progressBar.style.width = `${progress}%`;
            progressBar.textContent = `${progress}%`;
            createTableMessage.textContent = 'Tabla "epidemia" creada con éxito';
        } else {
            createTableMessage.textContent = 'Error al crear la tabla "epidemia"';
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