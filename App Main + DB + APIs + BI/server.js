const express = require('express');
const app = express();
const PORT = 3000;
const mysql = require('mysql');
const fs = require('fs');
const xlsx = require('xlsx');
const puppeteer = require('puppeteer');
const {createWorker} = require('tesseract.js');

const worker = createWorker();  // Create the worker object

// Configuración para servir archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));

// Configuración de la conexión a MySQL
const db = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Cambio2024',
    database: 'epidemia'
});

// Configuración de Multer
const multer = require('multer');
const upload = multer({
    dest: './uploads/',
    preservePath: true,
    limits: {fileSize: 10 * 1024 * 1024}, // Límite de tamaño de archivo (en bytes), aquí 10 MB
});

const uploadMultipleFiles = upload.array('excelfiles', 10); // Agrega esta línea

// Permitir solicitudes desde cualquier origen (CORS)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(express.json());
app.use(express.urlencoded({extended: true}));


// Ruta para la página principal
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});


// Define la consulta SQL para crear la tabla "dengue"
const createTableSql = `CREATE TABLE IF NOT EXISTS dengue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pais_nombre VARCHAR(255),
    provincia_nombre VARCHAR(255),
    departamento_nombre VARCHAR(255),
    ano_inicio VARCHAR(255),
    ano_fin VARCHAR(255),
    semanas_epidemiologicas VARCHAR(255),
    evento_nombre VARCHAR(255),
    grupo_edad_desc VARCHAR(255),
    cantidad_casos VARCHAR(255),
    tasa_de_Incidencia VARCHAR(255),
    Confirmados_Laboratorio VARCHAR(255),
    Muertes VARCHAR(255),
    Letalidad VARCHAR(255),
    Poblacion_X_1000 VARCHAR(255)
);`;

// Manejador de la solicitud para crear la tabla "dengue"
app.post('/create-table', async (req, res) => {
    try {

        // Ejecutar la consulta SQL para crear la tabla
        await db.query(createTableSql);

        // Registro de éxito en la consola
        console.log('Tabla "dengue" creada');

        // Responder con un JSON indicando el éxito
        res.json({success: true});
    } catch (error) {
        // Manejo de errores
        console.error('Error al crear la tabla:', error);

        // Responder con un JSON indicando el error
        res.json({success: false, error: error.message});
    }
});


// Ruta para la carga de archivos Excel
app.post('/upload', uploadMultipleFiles, async (req, res) => {
    try {

        const excelFiles = req.files;
        console.log('Archivos Excel cargados:', excelFiles.length);

        for (const excelFile of excelFiles) {
            const workbook = xlsx.readFile(excelFile.path);
            console.log('Libro de Excel leído correctamente:', excelFile.originalname);

            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const records = xlsx.utils.sheet_to_json(worksheet);
            console.log('Registros obtenidos del libro de Excel:', records.length);

            try {
                for (const record of records) {
                    console.log('Registro a insertar:', record);
                    const data = {
                        pais_nombre: record['pais_nombre'],
                        provincia_nombre: record['provincia_nombre'],
                        departamento_nombre: record['departamento_nombre'],
                        ano_inicio: record['ano_inicio'],
                        ano_fin: record['ano_fin'],
                        semanas_epidemiologicas: record['semanas_epidemiologicas'],
                        evento_nombre: record['evento_nombre'],
                        grupo_edad_desc: record['grupo_edad_desc'],
                        cantidad_casos: record['cantidad_casos'],
                        tasa_de_Incidencia: record['tasa_de_Incidencia'],
                        Confirmados_Laboratorio: record['Confirmados_Laboratorio'],
                        Muertes: record['Muertes'],
                        Letalidad: record['Letalidad'],
                        Poblacion_X_1000: record['Poblacion_X_1000']
                    };

                    console.log('Insertando registro:', data);

                    const sql = `INSERT INTO dengue (pais_nombre, provincia_nombre, departamento_nombre, ano_inicio, ano_fin, semanas_epidemiologicas, evento_nombre, grupo_edad_desc, cantidad_casos, tasa_de_Incidencia, Confirmados_Laboratorio, Muertes, Letalidad, Poblacion_X_1000)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

                    await db.query(sql, [
                        data.pais_nombre,
                        data.provincia_nombre,
                        data.departamento_nombre,
                        data.ano_inicio,
                        data.ano_fin,
                        data.semanas_epidemiologicas,
                        data.evento_nombre,
                        data.grupo_edad_desc,
                        data.cantidad_casos,
                        data.tasa_de_Incidencia,
                        data.Confirmados_Laboratorio,
                        data.Muertes,
                        data.Letalidad,
                        data.Poblacion_X_1000
                    ]);
                }
                console.log('Todos los registros insertados correctamente');
            } catch (error) {
                console.error('Error al insertar registros:', error);
                throw error; // Propaga el error para que sea manejado por el bloque catch externo
            }

            fs.unlinkSync(excelFile.path);
        }

        res.json({success: true});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar los archivos Excel');
        res.json({success: false, error: error.message});
    }
});


// Ruta para obtener todos los datos de la tabla "dengue"
app.get('/epidemia/dengue', async (req, res) => {
    try {
        // Consulta SQL para seleccionar todos los registros de la tabla "dengue"
        const sql = 'SELECT * FROM dengue';

        // Ejecuta la consulta SQL
        db.query(sql, (error, results, fields) => {
            if (error) {
                console.error('Error al obtener los datos de la tabla "dengue":', error);
                return res.status(500).json({
                    success: false,
                    error: 'Error al obtener los datos de la tabla "dengue"'
                });
            }

            // Envía los resultados como respuesta en formato JSON
            res.json({success: true, data: results});
        });
    } catch (error) {
        console.error('Error al obtener los datos de la tabla "dengue":', error);
        res.status(500).json({success: false, error: 'Error al obtener los datos de la tabla "dengue"'});
    }
});

// Define la consulta SQL para crear la tabla "scraping_ocr_dengue"
const createScrapingOcrTableSql = `CREATE TABLE IF NOT EXISTS scraping_ocr_dengue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    origen VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255),
    contenido LONGTEXT,
    fecha_obtencion DATETIME DEFAULT CURRENT_TIMESTAMP,
    url VARCHAR(255),
    ruta_archivo VARCHAR(255)
);`;

// Manejador de la solicitud para crear la tabla "scraping_ocr_dengue"
app.post('/create-scraping-ocr-table', async (req, res) => {
    try {
        // Ejecutar la consulta SQL para crear la tabla
        await db.query(createScrapingOcrTableSql);

        // Registro de éxito en la consola
        console.log('Tabla "scraping_ocr_dengue" creada');

        // Responder con un JSON indicando el éxito
        res.json({success: true});
    } catch (error) {
        // Manejo de errores
        console.error('Error al crear la tabla:', error);

        // Responder con un JSON indicando el error
        res.json({success: false, error: error.message});
    }
});

app.post('/scrape', async (req, res) => {
    const url = req.body.url; // Obtener la URL del cuerpo de la solicitud

    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url);

        // Realiza las operaciones de scraping aquí
        const data = await page.evaluate(() => {
            // Función para obtener los datos del sitio web
            return {
                title: document.title,
                content: document.body.innerText,
            };
        });

        await browser.close();

        // Insertar datos en la tabla scraping_ocr_dengue
        const sql = `INSERT INTO scraping_ocr_dengue (origen, tipo, titulo, contenido, url) VALUES ('scraping', 'web', ?, ?, ?);`;
        await db.query(sql, [data.title, data.content, url]);

        res.json({success: true, message: 'Datos insertados correctamente'});
    } catch (error) {
        console.error('Error al realizar el scraping:', error);
        res.status(500).json({success: false, error: 'Error al realizar el scraping'});
    }
});

// Ruta para cargar archivos
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        // Aquí puedes realizar cualquier procesamiento adicional necesario antes de guardar el archivo
        res.json({success: true, message: 'Archivo cargado correctamente', filename: req.file.filename});
    } catch (error) {
        console.error('Error al cargar el archivo:', error);
        res.status(500).json({success: false, error: 'Error al cargar el archivo'});
    }
});


// Modified function using Tesseract.js
app.post('/ocr', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({success: false, error: 'No se proporcionó ningún archivo'});
        }

        // Create Tesseract worker
        const worker = await createWorker({
            // Optional worker configuration options
        });

        // Load language data
        await worker.load();

        // Perform OCR using Tesseract.js
        const {data} = await worker.recognize(req.file.path, {
            language: 'spa' // Specify Spanish language
        });

        // Extract text from the response
        const text = data.text;

        // Insert OCR text into database
        const sql = `INSERT INTO scraping_ocr_dengue (origen, tipo, contenido, ruta_archivo) VALUES (?, ?, ?, ?);`;
        await db.query(sql, ['tesseract', 'archivo', text, req.file.filename]);

        // Release worker resources
        await worker.terminate();

        // Delete temporary file after OCR
        fs.unlinkSync(req.file.path);

        res.json({success: true, message: 'Texto extraído mediante Tesseract.js y almacenado en la base de datos'});
    } catch (error) {
        console.error('Error al realizar OCR:', error);
        res.status(500).json({success: false, error: 'Error al realizar OCR'});
    }
});

const reconnectInterval = 5000; // Intervalo de 5 segundos para reintentar la conexión

const startServer = () => {
    db.connect((err) => {
        if (err) {
            console.error('Error al conectar a la base de datos:', err);

            // Si el error es "Packets out of order", reintentar la conexión después de un intervalo
            if (err.code === 'PROTOCOL_PACKETS_OUT_OF_ORDER') {
                console.log('Reintentando conexión en', reconnectInterval / 1000, 'segundos...');
                setTimeout(startServer, reconnectInterval);
            } else {
                // Manejar otros errores según sea necesario
                console.error('Error desconocido:', err);
            }
        } else {
            console.log('Conexión a la base de datos establecida correctamente');

            // Iniciar el servidor web una vez que la conexión a la base de datos se haya establecido
            app.listen(PORT, () => {
                console.log('Servidor iniciado en el puerto:', PORT);
            });
        }
    });
};

// Intenta conectarse a la base de datos por primera vez
startServer();