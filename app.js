// Tian Qi Jiang 101020433

var mongo = require('mongodb').MongoClient;
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var DBURL="mongodb://localhost:27017/recipeDB";

app.set('views','./views');
app.set('view engine','pug');

//logger
app.use(function(req,res,next){
	console.log(req.method+" request for "+req.url);
	next();
});
// serve index pug page
app.get(["/","/home","/index.html","/index"], function(req,res){
	console.log("index");
	res.render('index');
});
// handle get request for recipe list
app.get("/recipes", function(req,res){
    // empty list for names
    var recipe = [];
    // connect to db
    mongo.connect(DBURL,function(err,db){
        // fetch all recipes in database
        // projection: include name, dont include id
        db.collection("recipes").find({}, {name:1, _id:0}, function(err,cursor){
            cursor.each(function(err,document){
                if(err){
                    console.log("Error connecting to DB", err);
                    res.sendStatus(500);
                }
                else if (document === null){
                    res.send(JSON.stringify({names: recipe})); // send object name with recipe list
                }
                else{
                    recipe.push(document.name); // add name to recipe list
                }
                db.close();
            });
        });
    });
});
// handle get request for viewing recipe
app.get("/recipe/:recipeName", function(req,res){
    mongo.connect(DBURL, function(err,db){
            // fetch recipe from database
        db.collection("recipes").findOne({name:req.params.recipeName}, function(err, document){
            if(err){
                console.log("Error connecting to DB", err);
                res.sendStatus(500);
            }
            else if (document===null){
                console.log("Error getting recipe");
                res.sendStatus(404);
            }
            else{
                res.send(document); // send recipe
            }
            db.close();
        });
    });
});
// handle post request for insert/updating recipe
app.use("/recipe", bodyParser.urlencoded({extended:true}));
app.post("/recipe", function(req,res){
    mongo.connect(DBURL, function(err,db){
        // if name field is empty, send 400 status
        if(!req.body.name){
            console.log("Error, recipe object contains no name");
            res.sendStatus(400);
        }
        else{
            //recieving new urlencoded object of recipe item
            //data sent as urlencoded object in post body
            var collection = db.collection("recipes");
            // upsert to db
            collection.update({name: req.body.name}, req.body, {upsert: true}, function(err,data){
                console.log("name: ", req.body.name);
                console.log("body: ", req.body);
                if(err){
                    console.log("Error connecting to DB: ", err);
                    res.sendStatus(500);
                }
                else{
                    console.log("Recipe Updated");
                    res.sendStatus(200);
                }
                db.close();
            });
        }
    });
});


//static server for non-pug files
app.use(express.static("./public"));
app.listen(2406,function(){console.log("Server online (port 2406)");});