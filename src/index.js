const express = require("express");
const app = express();
const colors = require('colors');
const morgan = require('morgan');
const Config = require('../config.js');

//settings
app.set('json spaces', 2);


// Configurar cabeceras y cors
const cors = require("cors");
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});
//cors
app.use(cors());

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
