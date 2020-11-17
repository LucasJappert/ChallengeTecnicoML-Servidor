const express = require("express");
const app = express();
const colors = require('colors');
const morgan = require('morgan');
const Config = require('../config.js');

//settings
app.set('json spaces', 2);

//middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

//routes
app.use('/api/items', require('./routes/items'));

//inicio server
app.listen(Config.Puerto, () => {
    console.log(colors.bgRed.white("Servidor corriendo en http://localhost:" + Config.Puerto));
    console.log(colors.bgRed.white("Cache del servidor: " + Config.TiempoCacheoEnSegundos + " segundos"));
});
