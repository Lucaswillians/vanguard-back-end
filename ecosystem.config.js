module.exports = {
  apps: [
    {
      name: "backend",
      script: "dist/main.js",
      node_args: "-r dotenv/config",
    },
  ],
};
