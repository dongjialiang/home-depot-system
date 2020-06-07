module.exports = {
    apps: [
        {
            name: 'app-master',
            script: './services/app-master.js',
            instances: 1,
            autorestart: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            error_file: `./logs/app-master-error.log`,
            out_file: './logs/app-master-out.log',
        },
        {
            name: 'app-worker',
            script: './server.js',
            instances: -1,
            exec_mode: 'cluster',
            autorestart: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            error_file: './logs/app-worker-error.log',
            out_file: './logs/app-worker-out.log',
        },
    ]
};
