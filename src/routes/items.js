const { Router } = require('express');
const router = Router();
const axios = require('axios');
var mcache = require('memory-cache');
const colors = require('colors');

//#region CACHE
var _FechaUltimaLimpieza = new Date();
const _TiempoCacheo = 120; //En segundos
console.log(colors.bgRed.white("Cache del servidor: " + _TiempoCacheo + " segundos."));
ChequearLimpiezaCache();
function ChequearLimpiezaCache(){
    try {
        let _FechaActual = new Date();
        
        var _Segundos = (_FechaActual.getTime() - _FechaUltimaLimpieza.getTime()) / 1000;
        _Segundos = Math.abs(_Segundos);

        if (_Segundos > _TiempoCacheo){
            //console.log("-- Keys eliminadas: " + mcache.memsize());
            mcache.clear();
            _FechaUltimaLimpieza = new Date();
        }
        setTimeout(() => {ChequearLimpiezaCache()}, 1000);
    } catch (error) {
        
    }
}
var cache = () => {
    return (req, res, next) => {
        let key = '__express__' + req.originalUrl || req.url;
        let cachedBody = mcache.get(key);
        if (cachedBody) {
            res.send(cachedBody);
            return;
        } else {
            res.sendResponse = res.send;
            res.send = (body) => {
                mcache.put(key, body);
                res.sendResponse(body);
            }
            next()
        }
    }
}
//#endregion

router.get('/', cache(), async (req, res) => {
    try {
        var q = req.query.q;
        if (q.length > 2){
            await axios.get("https://api.mercadolibre.com/sites/MLA/search?q=" + q)
            .then(function (response){
                let data = response.data;
                //console.log(data.results.length);
                //res.status(200).json(data.results.slice(0, 4));
                let _Retorno = new RetornoBusqueda();
                _Retorno.author.name = "Lucas";
                _Retorno.author.lastname = "Jappert";
                _Retorno.categories = ["cat1", "cat2", "cat3"];
                for (let i = 0; i < data.results.length; i++) {
                    let el = data.results[i];
                    let item = new Item();
                    item.id = el.id;
                    item.title = el.title;
                    item.price = new Precio(el.price);
                    item.picture = el.thumbnail;
                    item.condition = el.condition;
                    item.free_shipping = el.shipping.free_shipping;
                    item.sold_quantity = el.sold_quantity;

                    _Retorno.items.push(item);
                }

                res.status(200).json(_Retorno);
            })
            .catch(function (e){
                res.status(200).send(e);
            });
        }else{
            res.status(400).send("asdasd");
        }
    } catch (error) {
        res.status(400).send(error);
    }
});

router.get('/:id', cache(), async (req, res) => {
    try {
        var id = req.params.id;
        let _Retorno = new RetornoItem();
        await axios.get("https://api.mercadolibre.com/items/" + id)
            .then(function (response){
                let el = response.data;
                _Retorno.author.name = "Lucas";
                _Retorno.author.lastname = "Jappert";
                _Retorno.item.id = el.id;
                _Retorno.item.title = el.title;
                _Retorno.item.price = new Precio(el.price);
                _Retorno.item.picture = el.thumbnail;
                _Retorno.item.condition = el.condition;
                _Retorno.item.free_shipping = el.shipping.free_shipping;
                _Retorno.item.sold_quantity = el.sold_quantity;
            })
            .catch(function (e){
                console.log(e);
            });

            await axios.get("https://api.mercadolibre.com/items/" + id + "/description")
            .then(function (response){
                let el = response.data;
                _Retorno.item.description = el.plain_text;
            })
            .catch(function (e){
                console.log(e);
            });
        
        res.status(200).json(_Retorno);
    } catch (error) {
        res.status(400).send(error);
    }
});

//#region Clases Auxiliares
RetornoBusqueda = class {
    constructor(){
        this.author = new Autor();
        this.categories = [];
        this.items = [];
    }
};
RetornoItem = class {
    constructor(){
        this.author = new Autor();
        this.item = new Item;
    }
};
Autor = class {
    constructor(){
        this.name = "";
        this.lastname = "";
    }
};
Item = class {
    constructor(){
        this.id = "";
        this.title = "";
        this.price = new Precio();
        this.picture = "";
        this.condition = "";
        this.free_shipping = false;
        this.sold_quantity = 0;
    }
};
Precio = class {
    constructor(precio){
        this.currency = "pesos";
        this.amount = 0;
        this.decimals = 0;
        try {
            if(precio){
                precio = Math.abs(precio); // Change to positive
                this.amount = Math.trunc(precio);
                this.decimals = precio - Math.floor(precio);
            }
        } catch (error) {
            
        }
    }
};
//#endregion


module.exports = router;
