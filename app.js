const express = require("express");
const _ = require('lodash');
const bodyparser = require("body-parser");
const mongoose = require('mongoose')

const app = express();

const uri = 'mongodb://localhost:27017/todoDB';
const port = 3000;
const date = require(__dirname + "/date.js")
const day = date.newDate();

app.use(bodyparser.urlencoded({
  extended: true
}));
app.use(express.static("static"));
app.set("view engine", "ejs");

app.listen(port, () => {
  console.log("\nlistening to port " + port + "\n");
});


mongoose.connect(uri, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  // useFindAndModify: false  - Not using till I understand why findOneAndUpdate() didn't work
}, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Connected to Mongod succesfully");
  }
});

const itemShcema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});
const Item = new mongoose.model('Item', itemShcema);

const listSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  items: []
});
const List = new mongoose.model('list', listSchema);

const item1 = new Item({
  name: 'Welcome to todo list!!'
});
const item2 = new Item({
  name: 'Press the + to add items'
});
const item3 = new Item({
  name: '<-- press to check items of'
});
const defaultItems = [item1, item2, item3];



app.get("/", (req, res) => {

  Item.find((err, foundItems) => {

    if (err) {
      console.log(err);
    }

    if (foundItems == 0) {

      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log('succesfully save Default items');
        }
        res.redirect('/');
      });

    } else {

      res.render("list", {
        listTitle: day,
        newListItem: foundItems
      });

    };

  });

});

app.get("/:pageName", (req, res) => {
  const listName = _.capitalize(req.params.pageName);

  List.findOne({name: listName}, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: listName,
          items: defaultItems
        });
        list.save();

        res.render('list',{
          listTitle: listName,
          newListItem: list.items
        });
      }else{
        res.render('list',{
          listTitle: foundList.name,
          newListItem: foundList.items
        });
      }
    }
  });
});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  var item = new Item({
    name:itemName
  });

  if(listName == day){
    item.save(() => {
      console.log('Saved Item: ' + item.name);
    });
    res.redirect('/')
  }else{
    List.findOne({name:listName},(err,foundList)=>{
      if(!err){
        foundList.items.push(item);
        foundList.save();
        res.redirect('/'+listName)
      }
    });
  }
});

app.post('/delete', (req, res) => {
  const checkItemID = req.body.checkbox;
  const listName = req.body.listName;

  if(listName == day){
    Item.deleteOne({ _id: checkItemID}, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("succesfully deleted item " + checkItemID);
      }
    });
    res.redirect('/');
  }else{
    // List.findOneAndUpdate({name:listName},{$pull: {items: {_id:checkItemID}}},(err,foundList)=>{
    //   if(err){
    //     console.log(err);
    //   }else{
    //     console.log("succesfully deleted item " + checkItemID);
    //     res.redirect('/'+listName);
    //   }
    // });
    List.findOne({name:listName},(err,foundList)=>{
      if(err){
        console.log(err);
      }else{
        const array = foundList.items;
        var index;
        for(var i = 0; i < array.length;i++){

          if(array[i]._id == checkItemID){
            index = i;
          }
        }
        array.splice(index,1);
        foundList.save();
        res.redirect('/'+listName);
      }
    });
  }
});
