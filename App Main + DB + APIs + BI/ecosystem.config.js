module.exports = {
    apps: [{
        name: "app-edesur",
        script: "./server.js",
        watch: false, // Se refresca automaticamente con los nuevos cambios
        max_memory_restart: '4G', // Reiniciar si se excede 4GB de memoria
        exec_mode: "cluster", // Utiliza la cantidad de núcleos para crear instancias independientes
        instances: "max", // Utiliza la cantidad máxima de instancias según
        cron_restart: "59 23 * * *", // Lo que decimos es que a esa hora reinicie: 11:59:00 se reinicie
        env: {
            NODE_ENV: "development",
        }, env_production: {
            NODE_ENV: "production",
        }
    }]
}