module.exports = {
  apps: [
    {
      name: 'hrms-frontend',
      cwd: __dirname,
      // Serves the static Vite build (./dist) with SPA fallback so client-side
      // routes (e.g. /employees/:id on a hard refresh) resolve to index.html
      // instead of 404ing.
      script: 'node_modules/.bin/serve',
      args: ['-s', 'dist', '-l', process.env.FRONTEND_PORT || '4173'],
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
      },
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
