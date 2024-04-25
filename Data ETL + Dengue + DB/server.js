const express = require('express');
const app = express();
const mysql = require('mysql');
const fs = require('fs');
const xlsx = require('xlsx');

// Configuración para servir archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));

// Configuración de la conexión a MySQL
const db = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Sofiaazul3',
    database: 'epidemia'
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


// Define la consulta SQL para crear la tabla "dengue"
const createTableSql = `CREATE TABLE IF NOT EXISTS dengue (
    id INT AUTO_INCREMENT PRIMARY KEY,
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

                    const sql = `INSERT INTO dengue (provincia_nombre, departamento_nombre, ano_inicio, ano_fin, semanas_epidemiologicas, evento_nombre, grupo_edad_desc, cantidad_casos, tasa_de_Incidencia, Confirmados_Laboratorio, Muertes, Letalidad, Poblacion_X_1000)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

                    await db.query(sql, [
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

/*app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});*/

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
