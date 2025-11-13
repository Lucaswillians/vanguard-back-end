module.exports = {
  apps: [
    {
      name: "backend",
      script: "dist/main.js",
      env_file: ".env",
      node_args: "-r dotenv/config",
    },
  ],
};
