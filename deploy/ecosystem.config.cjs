module.exports = {
  apps: [
    {
      name: "ahtapot-n11-web",
      cwd: "/opt/ahtapot-n11/current/apps/web",
      script: "server.js",
      node_args: "--env-file=/opt/ahtapot-n11/.env",
      env: {
        NODE_ENV: "production",
        PORT: "4335",
        HOSTNAME: "127.0.0.1",
      },
      max_memory_restart: "400M",
    },
  ],
};
