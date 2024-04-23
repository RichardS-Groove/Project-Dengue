const express = require('express');
const app = express();
const mysql = require('mysql');
const fs = require('fs');
const xlsx = require('xlsx');

// Configuración de la conexión a MySQL
const db = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Sofiaazul3',
    database: 'dengue'
});

// Configuración de Multer
const multer = require('multer');
const upload = multer({
    dest: './uploads/',
    preservePath: true
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
// ... (other imports)

// ... (existing routes)

// Define la consulta SQL para crear la tabla "epidemia"
const createTableSql = `CREATE TABLE IF NOT EXISTS epidemia (
    pais_nombre VARCHAR(255) NOT NULL,
    provincia_nombre VARCHAR(255) NOT NULL
);`;

// Manejador de la solicitud para crear la tabla "epidemia"
app.post('/create-table', async (req, res) => {
    try {
        // Ejecutar la consulta SQL para crear la tabla
        await db.query(createTableSql);

        // Registro de éxito en la consola
        console.log('Tabla "epidemia" creada');

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
                        // ... other data mapping if needed
                    };

                    console.log('Insertando registro:', data);

                    const sql = `INSERT INTO epidemia (pais_nombre, provincia_nombre)
                                 VALUES (?, ?);`;

                    await db.query(sql, [data.pais_nombre, data.provincia_nombre]);
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

const startServer = () => {
    db.connect((err) => {
        if (err) {
            console.error('Error al conectar a la base de datos:', err);
            return;
        }

        console.log('Conexión a la base de datos establecida correctamente');

        app.listen(3000, () => {
            console.log('Servidor iniciado en el puerto 3000');
        });
    });
};

startServer();

app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

