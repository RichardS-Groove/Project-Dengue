module.exports = {
    apps: [{
        name: "app-unlz", script: "./server.js", watch: true, // Se refresca automaticamente con los nuevos cambios
        max_memory_resize: '4096', // Vigila constantemente que solo se use 1GB
        exec_mode: "cluster", // Usa cantidad de nucleos, para setear aplicaciones independientes
        instances: 1,// Le decimos que use una sola instancia en el cluster.
        cron_restart: "59 23 * * *", // Lo que decimos es que a esa hora reinicie: 11:59:00 se reinicie
        env: {
            NODE_ENV: "development",
        }, env_production: {
            NODE_ENV: "production",
        }
    }]
}