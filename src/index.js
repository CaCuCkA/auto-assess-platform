const express = require("express");
const path = require("path");
const hbs = require("hbs");

const authRoutes = require("./routes/auth");
// const homeRoutes = require("./routes/home");

require("./config/database");

const app = express();

const publicPath = path.join(__dirname, "../public");
const viewsPath = path.join(__dirname, "../templates");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(publicPath));

app.set("view engine", "hbs");
app.set("views", viewsPath);

app.use("/", authRoutes);
// app.use("/", homeRoutes);

app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

const PORT =  3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
