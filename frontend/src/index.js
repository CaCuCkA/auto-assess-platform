const express = require("express");
const path = require("path");
const hbs = require("hbs");
const session = require("express-session");
const Handlebars = require('handlebars');

require('dotenv').config({
    override: true,
    path: path.join(__dirname, '../.env')
});

const authRoutes = require("./routes/authRoutes");
const homeRoutes = require("./routes/homeRoutes");
const testRoutes = require("./routes/testRoutes");
const reportRoutes = require("./routes/reportRoutes");
const homeworkRoutes = require("./routes/homeworkRoutes");

const authMiddleware = require("./util/authMiddleware");

const app = express();

const publicPath = path.join(__dirname, "../public");
const viewsPath = path.join(__dirname, "../templates");

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: false,
            httpOnly: true,
            maxAge: 30 * 60 * 1000
        }
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(publicPath));

hbs.registerHelper('eq', function (a, b) {
    return a === b;
});

app.set("view engine", "hbs");
app.set("views", viewsPath);

app.use(authMiddleware);
app.use("/", homeRoutes);
app.use("/auth", authRoutes);
app.use("/test", testRoutes);
app.use("/report", reportRoutes);
app.use("/homework", homeworkRoutes);

app.use((req, res) => {
    res.status(404).render("error");
});

const PORT = 3000;

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
