#!/usr/bin/env node

(function () {
  "use strict";

  const WEBSERVER_DEFAULT_PORT = 8120;
  let port = process.env.PORT || WEBSERVER_DEFAULT_PORT;

  let secretManagement = require("./SecretManagement");
  secretManagement.tryLoadSecrets();

  let express = require("express");
  let cors = require("cors");
  const bodyParser = require("body-parser");
  const jwt = require("jsonwebtoken");
  const fs = require("fs");
  const path = require("path");
  let app = express();
  app.use(cors());
  app.use(bodyParser.json());

  const SECRET_KEY = "your_secret_key";

  // Cargar datos de usuarios desde el archivo JSON
  const usersFilePath = "./users.json";
  let users = {};
  try {
    const usersData = fs.readFileSync(usersFilePath);
    users = JSON.parse(usersData);
  } catch (error) {
    console.error("Error loading users data:", error);
  }

  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username] === password) {
      const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  });

  // Middlewares para proteger rutas
  function authenticateToken(req, res, next) {
    const token = req.headers["authorization"];
    if (!token) return res.sendStatus(403);

    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  }

  // We disable etag as it causes API calls to be cached even with Cache-Control: no-cache.
  app.disable("etag");

  // At /api/catalog is the catalog API that provides data for the frontend.
  let catalogApi = require("./CatalogApi");
  app.use("/api/catalog", authenticateToken, catalogApi.createRouter());

  // At /api/authorization is the Entitlement Service.
  let entitlementService = require("./EntitlementService");
  app.use(
    "/api/authorization",
    authenticateToken,
    entitlementService.createRouter()
  );

  app.listen(port);

  console.log("The website is now available at http://localhost:" + port);
  console.log("Press Control+C to shut down the application.");
})();
