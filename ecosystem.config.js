module.exports = {
  apps: [
    {
      name: "backend",
      script: "dist/main.js",
      node_args: "-r dotenv/config",
      env: {
        DOTENV_CONFIG_PATH: "/root/backend/.env", 
      },
    },
  ],
};
