const express = require('express');
const app = express();
const PORT = 3000;
const mysql = require('mysql');
const fs = require('fs');
const xlsx = require('xlsx');
const puppeteer = require('puppeteer');
const {createWorker} = require('tesseract.js');
const {GoogleGenerativeAI} = require("@google/generative-ai");
const bodyParser = require('body-parser');
require('dotenv').config();
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

// Configuración para servir archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuración de la conexión a MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
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

// Ruta para la página principal
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Ruta para obtener las variables de entorno
app.get('/env', (req, res) => {
    res.json({
        apiEpDeUrl: process.env.API_EP_DE_URL,
        apiChatbotUrl: process.env.API_CHATBOT_URL,
        apiScrapingOcrUrl: process.env.API_SCRAPING_OCR_URL,
        apiPm2Url: process.env.API_PM2_URL,
        apiNgrokUrl: process.env.API_NGROK_URL,
        apiOnlineUrl: process.env.APP_ONLINE,
    });
});

// Ruta para la página Chatbot
app.get('/Chatbot', (req, res) => {
    res.sendFile(__dirname + '/chatbot.html');
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
    Poblacion_X_1000 VARCHAR(255),
    vacunacion VARCHAR(255) 
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
                        Poblacion_X_1000: record['Poblacion_X_1000'],
                        vacunacion: record['vacunacion']
                    };

                    console.log('Insertando registro:', data);

                    const sql = `INSERT INTO dengue (pais_nombre, provincia_nombre, departamento_nombre, ano_inicio, ano_fin, semanas_epidemiologicas, evento_nombre, grupo_edad_desc, cantidad_casos, tasa_de_Incidencia, Confirmados_Laboratorio, Muertes, Letalidad, Poblacion_X_1000, vacunacion)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

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
                        data.Poblacion_X_1000,
                        data.vacunacion
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

app.get('/epidemia/scraping_ocr_dengue', async (req, res) => {
    try {
        // Consulta SQL para seleccionar todos los registros de la tabla "dengue"
        const sql = 'SELECT * FROM scraping_ocr_dengue';

        // Ejecuta la consulta SQL
        db.query(sql, (error, results, fields) => {
            if (error) {
                console.error('Error al obtener los datos de la tabla "scraping_ocr_dengue":', error);
                return res.status(500).json({
                    success: false,
                    error: 'Error al obtener los datos de la tabla "scraping_ocr_dengue"'
                });
            }

            // Envía los resultados como respuesta en formato JSON
            res.json({success: true, data: results});
        });
    } catch (error) {
        console.error('Error al obtener los datos de la tabla "scraping_ocr_dengue":', error);
        res.status(500).json({success: false, error: 'Error al obtener los datos de la tabla "scraping_ocr_dengue"'});
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


// Todo sobre el ChatBot

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
// Cache para almacenar respuestas a consultas frecuentes
const queryCache = new Map();

// Almacén de contexto de conversación
const conversationContext = new Map();

app.use(express.json());


// Chatbot con Gemini y extracción de datos de MySQL
app.post('/chat', async (req, res) => {
    try {
        const {prompt, userId} = req.body;

        // Obtener o inicializar el contexto de la conversación
        let context = conversationContext.get(userId) || [];
        context.push({role: 'user', content: prompt});

        // Verificar si la consulta está en caché
        const cachedResponse = queryCache.get(prompt);
        if (cachedResponse) {
            context.push({role: 'assistant', content: cachedResponse});
            conversationContext.set(userId, context.slice(-5));
            return res.json({output: cachedResponse});
        }

        let response = '';

        // Manejo de preguntas específicas
        if (prompt.toLowerCase().includes('cuántos países') || prompt.toLowerCase().includes('cuantos paises')) {
            const totalPaises = await countCountries();
            response = `En la base de datos hay un total de ${totalPaises} países.`;
        } else if (prompt.toLowerCase().includes('nombres de los países') || prompt.toLowerCase().includes('nombres de los paises')) {
            const paises = await getCountryNames();
            response = `Los países en la base de datos son: ${paises.join(', ')}.`;
        } else if (prompt.toLowerCase().includes('información del país')) {
            const pais = extractCountryName(prompt);
            const infoPais = await getCountryInfo(pais);
            response = formatCountryInfo(infoPais);
        } else if (prompt.toLowerCase().includes('información de la provincia')) {
            const provincia = extractProvinceName(prompt);
            const infoProvincia = await getProvinceInfo(provincia);
            response = formatProvinceInfo(infoProvincia);
        } else if (prompt.toLowerCase().includes('información del departamento')) {
            const departamento = extractDepartmentName(prompt);
            const infoDepartamento = await getDepartmentInfo(departamento);
            response = formatDepartmentInfo(infoDepartamento);
        } else if (prompt.toLowerCase().includes('información del año')) {
            const año = extractYear(prompt);
            const infoAño = await getYearInfo(año);
            response = formatYearInfo(infoAño);
        } else if (prompt.toLowerCase().includes('información de los años')) {
            const [añoInicio, añoFin] = extractYearRange(prompt);
            const infoAños = await getYearRangeInfo(añoInicio, añoFin);
            response = formatYearRangeInfo(infoAños);
        } else {
            // Si no es una pregunta específica, usar el procesamiento existente
            const dbData = await extractRelevantData(prompt);
            const sentiment = analyzeSentiment(prompt);
            const formattedData = formatDataForGemini(dbData);

            const enhancedPrompt = `
                Contexto de la conversación: ${context.map(c => `${c.role}: ${c.content}`).join('\n')}
                Sentimiento del usuario: ${sentiment}
                Información relevante de la base de datos: ${formattedData}
                Pregunta del usuario: ${prompt}
                Por favor, responde a la pregunta del usuario utilizando la información de la base de datos proporcionada. 
                Si no hay información relevante, indícalo claramente en tu respuesta.
            `;

            const model = genAI.getGenerativeModel({model: "gemini-1.5-flash"});
            const result = await model.generateContent(enhancedPrompt);
            response = result.response.text();
        }

        // Actualizar el contexto de la conversación
        context.push({role: 'assistant', content: response});
        conversationContext.set(userId, context.slice(-5));

        // Cachear la respuesta
        queryCache.set(prompt, response);

        res.json({output: response});
    } catch (error) {
        console.error('Error en el servidor (chat):', error);
        res.status(500).json({error: 'Error en el servidor'});
    }
});

async function extractRelevantData(prompt) {
    return new Promise((resolve, reject) => {
        if (prompt.toLowerCase().includes('cuantos paises') || prompt.toLowerCase().includes('cuántos países')) {
            countCountries().then(resolve).catch(reject);
        } else if (prompt.toLowerCase().includes('nombres de los paises') || prompt.toLowerCase().includes('qué países')) {
            getCountryNames().then(resolve).catch(reject);
        } else {
            // Extraer palabras clave del prompt
            const keywords = extractKeywords(prompt);

            let query = 'SELECT * FROM dengue WHERE 1=1';
            let params = [];

            keywords.forEach(keyword => {
                query += ` AND (pais_nombre LIKE ? OR provincia_nombre LIKE ? OR evento_nombre LIKE ?)`;
                params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
            });

            query += ' LIMIT 5';

            db.query(query, params, (error, results) => {
                if (error) {
                    console.error('Error al consultar MySQL:', error);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        }
    });
}

function countCountries() {
    return new Promise((resolve, reject) => {
        const query = 'SELECT COUNT(DISTINCT pais_nombre) AS total_paises FROM dengue';
        db.query(query, (error, results) => {
            if (error) {
                console.error('Error al contar países:', error);
                reject(error);
            } else {
                resolve(results[0].total_paises);
            }
        });
    });
}

function formatDataForGemini(dbData) {
    if (typeof dbData === 'number') {
        return `Total número de países: ${dbData}`;
    }
    if (Array.isArray(dbData) && dbData.length > 0 && typeof dbData[0] === 'string') {
        return `Países en la base de datos: ${dbData.join(', ')}`;
    }
    if (!Array.isArray(dbData) || dbData.length === 0) {
        return 'No se encontraron datos relevantes en la base de datos.';
    }
    return dbData.map(row => {
        return `País: ${row.pais_nombre}, Provincia: ${row.provincia_nombre}, Año: ${row.ano_inicio}-${row.ano_fin}, Casos: ${row.cantidad_casos}, Muertes: ${row.Muertes}`;
    }).join('\n');
}

function analyzeSentiment(text) {
    const analyzer = new natural.SentimentAnalyzer('Spanish', natural.PorterStemmerEs, 'afinn');
    const tokens = tokenizer.tokenize(text);
    const sentiment = analyzer.getSentiment(tokens);
    return sentiment > 0 ? 'positivo' : sentiment < 0 ? 'negativo' : 'neutral';
}

function extractKeywords(text) {
    const tokens = tokenizer.tokenize(text);
    const stopwords = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'pero', 'si', 'no', 'en', 'por', 'para'];
    return tokens.filter(token => !stopwords.includes(token.toLowerCase()));
}

function getCountryNames() {
    return new Promise((resolve, reject) => {
        const query = 'SELECT DISTINCT pais_nombre FROM dengue ORDER BY pais_nombre';
        db.query(query, (error, results) => {
            if (error) {
                console.error('Error al obtener nombres de países:', error);
                reject(error);
            } else {
                resolve(results.map(row => row.pais_nombre));
            }
        });
    });
}

async function getCountryInfo(pais) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                pais_nombre,
                COUNT(DISTINCT provincia_nombre) as total_provincias,
                MIN(ano_inicio) as ano_inicio,
                MAX(ano_fin) as ano_fin,
                SUM(CAST(cantidad_casos AS UNSIGNED)) as total_casos,
                SUM(CAST(Muertes AS UNSIGNED)) as total_muertes,
                AVG(CAST(Letalidad AS DECIMAL(10,2))) as letalidad_promedio
            FROM dengue
            WHERE pais_nombre = ?
            GROUP BY pais_nombre
        `;
        db.query(query, [pais], (error, results) => {
            if (error) reject(error);
            else resolve(results[0]);
        });
    });
}

async function getProvinceInfo(provincia) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                pais_nombre,
                provincia_nombre,
                COUNT(DISTINCT departamento_nombre) as total_departamentos,
                MIN(ano_inicio) as ano_inicio,
                MAX(ano_fin) as ano_fin,
                SUM(CAST(cantidad_casos AS UNSIGNED)) as total_casos,
                AVG(CAST(tasa_de_Incidencia AS DECIMAL(10,2))) as tasa_incidencia_promedio
            FROM dengue
            WHERE provincia_nombre = ?
            GROUP BY pais_nombre, provincia_nombre
        `;
        db.query(query, [provincia], (error, results) => {
            if (error) reject(error);
            else resolve(results[0]);
        });
    });
}

async function getDepartmentInfo(departamento) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                pais_nombre,
                provincia_nombre,
                departamento_nombre,
                MIN(ano_inicio) as ano_inicio,
                MAX(ano_fin) as ano_fin,
                SUM(CAST(Confirmados_Laboratorio AS UNSIGNED)) as total_confirmados,
                MAX(CAST(Poblacion_X_1000 AS UNSIGNED)) as poblacion_reciente
            FROM dengue
            WHERE departamento_nombre = ?
            GROUP BY pais_nombre, provincia_nombre, departamento_nombre
        `;
        db.query(query, [departamento], (error, results) => {
            if (error) reject(error);
            else resolve(results[0]);
        });
    });
}

async function getYearInfo(año) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                COUNT(DISTINCT pais_nombre) as total_paises,
                SUM(CAST(cantidad_casos AS UNSIGNED)) as total_casos,
                SUM(CAST(Muertes AS UNSIGNED)) as total_muertes,
                MAX(CASE WHEN CAST(cantidad_casos AS UNSIGNED) = (
                    SELECT MAX(CAST(cantidad_casos AS UNSIGNED))
                    FROM dengue
                    WHERE ano_inicio = ? OR ano_fin = ?
                ) THEN pais_nombre END) as pais_mas_casos
            FROM dengue
            WHERE ano_inicio = ? OR ano_fin = ?
        `;
        db.query(query, [año, año, año, año], (error, results) => {
            if (error) reject(error);
            else resolve(results[0]);
        });
    });
}

async function getYearRangeInfo(añoInicio, añoFin) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                ano_inicio,
                SUM(CAST(cantidad_casos AS UNSIGNED)) as total_casos,
                SUM(CAST(Muertes AS UNSIGNED)) as total_muertes,
                AVG(CAST(Letalidad AS DECIMAL(10,2))) as letalidad_promedio
            FROM dengue
            WHERE ano_inicio BETWEEN ? AND ?
            GROUP BY ano_inicio
            ORDER BY ano_inicio
        `;
        db.query(query, [añoInicio, añoFin], (error, results) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
}

function formatCountryInfo(info) {
    if (!info) return "No se encontró información para este país.";
    return `
        País: ${info.pais_nombre}
        Total de provincias: ${info.total_provincias}
        Rango de años con datos: ${info.ano_inicio} - ${info.ano_fin}
        Total de casos: ${info.total_casos}
        Total de muertes: ${info.total_muertes}
        Letalidad promedio: ${info.letalidad_promedio.toFixed(2)}%
    `;
}

function formatProvinceInfo(info) {
    if (!info) return "No se encontró información para esta provincia.";
    return `
        País: ${info.pais_nombre}
        Provincia: ${info.provincia_nombre}
        Total de departamentos: ${info.total_departamentos}
        Rango de años con datos: ${info.ano_inicio} - ${info.ano_fin}
        Total de casos: ${info.total_casos}
        Tasa de incidencia promedio: ${info.tasa_incidencia_promedio}
    `;
}

function formatDepartmentInfo(info) {
    if (!info) return "No se encontró información para este departamento.";
    return `
        País: ${info.pais_nombre}
        Provincia: ${info.provincia_nombre}
        Departamento: ${info.departamento_nombre}
        Rango de años con datos: ${info.ano_inicio} - ${info.ano_fin}
        Total de casos confirmados por laboratorio: ${info.total_confirmados}
        Población más reciente (x1000): ${info.poblacion_reciente}
    `;
}

function formatYearInfo(info) {
    if (!info) return "No se encontró información para este año.";
    return `
        Año: ${info.ano}
        Total de países con casos reportados: ${info.total_paises}
        Total de casos: ${info.total_casos}
        Total de muertes: ${info.total_muertes}
        País con más casos: ${info.pais_mas_casos}
    `;
}

function formatYearRangeInfo(info) {
    if (!info || info.length === 0) return "No se encontró información para este rango de años.";
    let response = `Información para el rango de años ${info[0].ano_inicio} - ${info[info.length - 1].ano_inicio}:\n`;
    info.forEach(year => {
        response += `
        Año ${year.ano_inicio}:
        - Total de casos: ${year.total_casos}
        - Total de muertes: ${year.total_muertes}
        - Letalidad promedio: ${year.letalidad_promedio.toFixed(2)}%\n`;
    });
    return response;
}

function extractCountryName(prompt) {
    const match = prompt.match(/país\s+(\w+)/i);
    return match ? match[1] : null;
}

function extractProvinceName(prompt) {
    const match = prompt.match(/provincia\s+(\w+)/i);
    return match ? match[1] : null;
}

function extractDepartmentName(prompt) {
    const match = prompt.match(/departamento\s+(\w+)/i);
    return match ? match[1] : null;
}

function extractYear(prompt) {
    const match = prompt.match(/año\s+(\d{4})/i);
    return match ? match[1] : null;
}

function extractYearRange(prompt) {
    const match = prompt.match(/años\s+(\d{4})\s+a\s+(\d{4})/i);
    return match ? [match[1], match[2]] : null;
}