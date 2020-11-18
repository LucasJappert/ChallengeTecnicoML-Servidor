const { Router } = require('express');
const router = Router();
const axios = require('axios');
var mcache = require('memory-cache');
const Config = require('../../config.js');
const colors = require('colors');

//#region CACHE
var _FechaUltimaLimpieza = new Date();
ChequearLimpiezaCache();
function ChequearLimpiezaCache(){
    try {
        let _FechaActual = new Date();
        
        var _Segundos = (_FechaActual.getTime() - _FechaUltimaLimpieza.getTime()) / 1000;
        _Segundos = Math.abs(_Segundos);

        if (_Segundos > Config.TiempoCacheoEnSegundos){
            console.log(colors.red("-- Keys eliminadas: " + mcache.memsize() + ". " + new Date()));
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
            console.log(colors.yellow("Respuesta retornada caché: " + key));
            res.send(cachedBody);
            return;
        } else {
            res.sendResponse = res.send;
            res.send = (body) => {
                console.log(colors.green("Respuesta guardada en caché: " + key));
                mcache.put(key, body);
                res.sendResponse(body);
            }
            next()
        }
    }
}
//#endregion

//#region ENDPOINTs
/**
 * Ejemplo de llamada: http://localhost:2004/api/items?q=reloj
 */
router.get('/', cache(), async (req, res) => {
    try {
        var q = req.query.q;
        if (q.length > 1){
            await axios.get("https://api.mercadolibre.com/sites/MLA/search?q=" + q)
            .then(function (response){
                let data = response.data;
                data.results = data.results.slice(0, Config.LimiteProductosDevueltos);
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
                    item.picture = el.thumbnail.replace("http://", "https://");
                    item.condition = el.condition.replace("new", "Nuevo").replace("used", "Usado");
                    item.free_shipping = el.shipping.free_shipping;
                    item.sold_quantity = el.sold_quantity;
                    item.address_state_name = el.address.state_name;

                    _Retorno.items.push(item);
                }

                res.status(200).json(_Retorno);
            })
            .catch(function (e){
                res.status(400).json({status: 400, message: e});
            });
        }else{
            res.status(400).json({status: 400, message: "Parámetro inválido!"});
        }
    } catch (error) {
        res.status(400).json({status: 400, message: error});
    }
});

/**
 * Ejemplo de llamada: http://localhost:2004/api/items/MLA878112859
 */
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
            _Retorno.item.picture = el.pictures[0].url.replace("http://", "https://");
            _Retorno.item.condition = el.condition.replace("new", "Nuevo").replace("used", "Usado");
            _Retorno.item.free_shipping = el.shipping.free_shipping;
            _Retorno.item.sold_quantity = el.sold_quantity;
            _Retorno.item.address_state_name = el.seller_address.state.name;
            _Retorno.item.category_id = el.category_id;
        })
        .catch(function (e){
            res.status(400).json({status: 400, message: e}); return;
        });

        await axios.get("https://api.mercadolibre.com/items/" + id + "/description")
        .then(function (response){
            let el = response.data;
            _Retorno.item.description = el.plain_text;
        })
        .catch(function (e){
            res.status(400).json({status: 400, message: e}); return;
        });
        
        await axios.get("https://api.mercadolibre.com/categories/" + _Retorno.item.category_id)
        .then(function (response){
            let _Data = response.data;
            _Retorno.item.categories = _Data.path_from_root;
            // console.log(el);
        })
        .catch(function (e){
            res.status(400).json({status: 400, message: e}); return;
        });
        
        res.status(200).json(_Retorno);
    } catch (e) {
        res.status(400).json({status: 400, message: e});
    }
});
//#endregion

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
        this.address_state_name = "";
    }
};
Precio = class {
    constructor(precio){
        this.currency = "$";
        this.amount = 0;
        this.decimals = 0;
        try {
            if(precio){
                precio = Math.abs(precio); // Aseguro que sea positivo
                this.amount = Math.trunc(precio);
                this.decimals = Math.round(precio % 1 * 100, 2);// Math.round(precio - this.amount, 2).toFixed(2);
            }
        } catch (error) {
            
        }
    }
};
//#endregion


module.exports = router;
