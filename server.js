const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { is } = require('express/lib/request');

require('dotenv').config();

const app = express();

const port =  process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri =process.env.ATLAS_URI;
mongoose.connect(uri, {useNewUrlParser: true,
    useUnifiedTopology: true});

const connection = mongoose.connection;

const Schema = mongoose.Schema;

const itemsSchema = new Schema({
    item : String
});

const Item = mongoose.model("Item",itemsSchema);

const userSchema = new Schema({
    username: String ,
    password: String,
    mail: String ,
    items: [itemsSchema] ,
  }, {
    timestamps: true,
  });
    
  const User = mongoose.model('User', userSchema);

app.post("/signup",function(req,res){
    const username = req.body.username;
    const password = req.body.password;
    const mail = req.body.mail;    
    const items = req.body.items;

        User.findOne({mail: mail},function(err,founduser){
            if(founduser){
                res.send("user exists");
            }else{
                const newUser = new User({
                    username, 
                    password,
                    mail,
                    items
                });
                newUser.save()
                .then(() => res.json('User added!'))
                .catch(err => res.status(400).json('Error: ' + err));
            }
        });

});


app.post("/login",function(req,res){
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({username: username, password: password},function(err,founduser){
        if(founduser){
            res.send("User Loged in!");
            // res.redirect("/username/add");
        }else{
            res.send("User does not exist!");
            // res.redirect("/signup");
        }
    })
});

app.post("/:id/add",function(req,res){
    const id = req.params.id;
    const itemName = req.body.item;  
    console.log(req.body.item);
    const item = new Item({item: itemName});
    User.findOne({_id: id},function(err,founduser){
        if(founduser){
            founduser.items.push(item);
            founduser.save();
            res.send("item added successfully")
        }else{
            console.log(err)
        }
    })
});

app.post("/:id/removeuser",function(req,res){
    const id = req.params.id;
    const checkedItemId = req.body.checkbox;
    // const listName = req.body.listName;
    User.findOne({_id: id},function(err,founduser){
        if(founduser){
            User.findByIdAndRemove(checkedItemId,function(err){
                console.log(checkedItemId)
                if(!err){
                    res.send("user removed");
                }else{
                    console.log(err);
                }
            });
        }else{
            console.log(err);
        }
    })
})

app.post("/:id/delete",function(req,res){
    const id = req.params.id;
    const checkedItemId = req.body.checkbox;

    User.findOneAndUpdate({_id: id}, {$pull:{items:{_id: checkedItemId}}},function(err,foundList){
        if(!err){
            res.redirect("/" + foundList);
        }else{
            console.log(err);
        }
    });
})

app.post("/:id/edit",function(req,res){
    const id = req.params.id;
    const checkedItemId = req.body.checkbox;
    const updateItem = req.body.updateItem;

    User.findOne({_id: id},function(err,founduser){
        if(founduser){
            for(var i=0;i<founduser.items.length;i++){
                var y = founduser.items[i]._id.toString();
                var x=checkedItemId
                if(x == y){
                    founduser.items[i].$set({item:updateItem})
                    User.updateOne({_id:id},{$set:{items: founduser.items}},function(err,founduser){
                        if(!err){
                                console.log("item edited");
                            }
                    })
                    console.log(founduser)
                    res.send("Item edited")
                }
            }}
        })
})

app.get("/:id",function(req,res){
    const id = req.params.id;

    User.findOne({_id: id},function(err,founduser){
        if(!err){
        res.render("items",{username: founduser.username,itemsfound:founduser.items})
        }
    })
})

connection.once('open',() => {
    console.log("MongoDB established successfully");
});

app.listen(port,() => {
    console.log(`server running on port ${port}`);
});
