/*
 * Trello by Prath, aka Prello
 * @author Prathmesh Patel
 */
Vue.component('create-lists', {
  template: '#create-template'

})

Vue.component('manage-lists', {
  template: '#manage-template'
})

var config = {
    apiKey: "AIzaSyAylwJQ-ezEvUkxHlsUYUdxEuOCwrJtXmo",
    authDomain: "trello-vue-clone.firebaseapp.com",
    databaseURL: "https://trello-vue-clone.firebaseio.com",
    projectId: "trello-vue-clone",
    storageBucket: "trello-vue-clone.appspot.com",
    messagingSenderId: "422468067426"
};

// global access to initialized app database
var db = firebase.initializeApp(config).database();
// global reference to remote storage
var storageRef = firebase.storage().ref();
// global reference to remote data
var imagesRef = db.ref('images');
// global reference to remote data
var listRef = db.ref('lists');
var colorRef = db.ref('preferences');
var userRef = db.ref('users');
var currentRef =db.ref('current');
var categoriesRef =db.ref('categories');
// connect Firebase to Vue
Vue.use(VueFire);

// app Vue instance
var app =new Vue({
    el:'#app',
    data: {
        message:"",
        currentView: 'manage-lists',
        title:"Prello",
        bgc:"lightpink",
        changingInfo:false,
        addingList:false,
        newListTitle:"",
        editListTitle:"",
        cardTitle:"",
        cardDescription:"",
        cardDate:"",
        cardTodo:"",
        cardDeadline:"",
        cardCategories:[],
        categoryLabel:"",
        categoryColor:"",
        addingComment:false,
        addingCategory:false,
        comment:"",  
        userName:"",
        userEmail:"",
        enter:false,
        vert:false,
        loginName:"",
        loginEmail:"",
        currentName:"",
        currentEmail:"",
        changeEmail:"",
        changeName:"",
        drawer:false,
        drawerItems:[
          "Change User Information",
          "Logout"
        ],
        numList:0,
        numCards:0,
        selected:[],
        filterDateInput: '',
    },
    
     // local representations of data from firebase 
     firebase: {
        users: userRef,
        lists: listRef,
        categories: categoriesRef,
        imageF: imagesRef,
        colors: colorRef,
        current: currentRef,

    },

    // methods used as data from within HTML code
    methods: {
        toggleCreate(){
          if(currentView=='manage-lists'){
            currentView='create-lists';
          }else{
            currentView='manage-lists';
          }
        },
        addUser(){
          if (this.userName && this.userEmail){
            for (i=0;i<this.users.length;i++){
              if (this.users[i].email == this.userEmail){
                alert("Hey, you already have an account!");
                return;
              }
            }
            this.enter =true;
            var regkey= userRef.push({name: this.userName, email: this.userEmail}).key;
            currentRef.update({name: this.userName, email:this.userEmail, key:regkey});
          }else{
            alert("Enter name and email, fam!");
          }
        },
        login(){
          if(this.loginEmail){
            for(i=0;i<this.users.length;i++){
              if(this.users[i].email==this.loginEmail){
                this.enter=true;
                currentRef.update({name:this.users[i].name, email:this.users[i].email, key:this.users[i]['.key']});
                return;
              }
            }
            alert("No match, please register!");
          }else{
            alert("Put in Email!");
          }
        },
        changeColor(color){
          colorRef.update({
            bgc:color
          });
        },
        showIt(x){
            console.log(x); 
        },
        addList(){
          if (this.newListTitle) {
            this.numList = this.numList + 1;
            listRef.push({id: this.numList, ltitle: this.newListTitle, editing: false, adding: false, active: true, listCards: false
            })
            this.addListDone();
          }
        },
        addListDone(){
          this.newListTitle='';
          this.addingList=false;
        },
        editTitle(list){
          if (this.editListTitle) { 
            listRef.child(list['.key']).update({ltitle: this.editListTitle});
          this.editTitleDone(list);
          }       
        },
        editTitleDone(list){
          this.editListTitle = '';
          list.editing = false;
        },
        moveList(list, dir) { //done
          var listIndex = this.lists.indexOf(list);
          if ((dir == 1 && this.lists[listIndex] != null) || (dir == -1 && listIndex > 0)) {
            var l = this.lists[listIndex];
            this.lists.splice(listIndex, 1);
            this.lists.splice(listIndex + dir, 0, l);
            console.log("moving list");
            this.moveCardData();
          }
        },
        addCard(lis) { //EDIT
          if (this.cardTitle) {
              this.numCards = this.numCards + 1
              var todos = this.cardTodo.split(",");
              var doneList = [];
              for (var i = 0; i < todos.length; i++) {
                doneList.push({
                  item: todos[i]
                });
              }
              var dateD = new Date();
              listRef.child(lis['.key']).child('listCards').push({
                id: this.numCards, ltitle: this.cardTitle, timestamp: (dateD.getMonth() + 1) + '/' + dateD.getDate() + '/' + dateD.getFullYear(), description: this.cardDescription, deadline: this.cardDeadline, todo: doneList,
                show: true, active: false, categories: this.cardCategories, users: this.selected, editing: false, addingComment: false, comments: false
              });
              this.addCardDone(lis);
              console.log("add card");
            }
        },
        addCardDone(l) { 
          this.cardTitle = '';
          this.cardDescription = '';
          this.cardDeadline = '';
          l.adding = false;
          this.cardTodo = '';
          console.log("add card done");
        },       
        moveCard(lis, c, cardIndex, dir) { //done
          var listIndex = this.lists.indexOf(lis);
          if(this.lists[listIndex + dir]){
            var nextKey = this.lists[listIndex + dir]['.key'];
            console.log(nextKey);
            listRef.child(lis['.key']).child('listCards').child(cardIndex).once('value').then(function (snapshot) {
            const card = snapshot.val();
            //remove old card
            this.numCards--;
            listRef.child(lis['.key']).child('listCards').child(cardIndex).remove();
            
            listRef.child(nextKey).child('listCards').push(card);
            if(!(listRef.child(lis['.key']).child('listCards'))){
              listRef.child(lis['.key']).update({ listCards:false });
            }
          })
            
            console.log("moved card");
          }
          // var listIndex = this.cards.indexOf(l);
          //       //get next list key
          //       var nextKey = this.cards[listIndex + dir]['.key'];
          //       listRef.child(l['.key']).child('listCards').child(cindex).once('value').then(function (snapshot) {
          //           const card = snapshot.val();
          //           //remove old card
          //           this.numCards--;
          //           listRef.child(l['.key']).child('listCards').child(cindex).remove();
          //           listRef.child(nextKey).child('listCards').push(card);
          //       })
        },
        moveCardData() {
          var l = this.lists.slice(0);
          var len = this.lists.length;
          console.log(l);
          console.log(len);
          listRef.remove();
          for (var i = 0; i < len; i++) {
            listRef.push({
              id: l[i].id, ltitle: l[i].ltitle, editing: l[i].editing, adding: l[i].adding, active: l[i].active
              , listCards: l[i].listCards
            });
            console.log("moving card data");
          }
          // var listCopy = this.cards.slice(0);
          // var num = this.cards.length;
          // listRef.remove();
          // for (var i = 0; i < num; i++) {
          //   listRef.push({
          //     id: listCopy[i].id
          //     , ltitle: listCopy[i].ltitle
          //     , editing: listCopy[i].editing
          //     , adding: listCopy[i].adding
          //     , active: listCopy[i].active
          //     , listCards: listCopy[i].listCards
          //   });
          // }   
        },
        addComment(l, c, lindex, cindex) {
          listRef.child(l['.key']).child('listCards').child(cindex).child('comments').push(this.comment);
          this.addCommentDone(c);
        },
        addCommentDone(c) {
          this.comment = "";
          c.addingComment = false;
        },

        addCategory() {
          categoriesRef.push({
              label: this.categoryLabel
              , color: this.categoryColor
          });
          this.addCategoryDone();
        }, 
        addCategoryDone() {
          this.categoryLabel = "";
          this.categoryColor = "";
          this.addingCategory = false;
        },
        filterCategory(cat) {
          var continueLoop = true;
          var catColor = '';
          categoriesRef.once('value', function (snapshot) {
              catLabel = snapshot.val()[cat['.key']]['label'];
          });
          //                console.log(catColor);
          listRef.once('value', function (listSnapshot) {
              //                    console.log(catColor);
              listSnapshot.forEach(function (listSnapshot) {
                  listSnapshot.child('listCards').forEach(function (cardSnapshot) {
                      var listCard = cardSnapshot.val();
                      continueLoop = true;
                      if (!listCard.categories) {
                          cardSnapshot.ref.update({
                              'show': false
                          });
                      }
                      cardSnapshot.child('categories').forEach(function (categorySnapshot) {
                          if (continueLoop) {
                              var category = categorySnapshot.val();
                              if (category == catLabel) {
                                  cardSnapshot.ref.update({
                                      'show': true
                                  });
                                  continueLoop = false;
                              }
                              else {
                                  console.log('hi');
                                  cardSnapshot.ref.update({
                                      'show': false
                                  });
                              }
                          }
                      });
                  });
              });
          });
        },
        filterDate() {
          if (this.filterDateInput) {
              var filterDateInput = $('#filterDateInput').val();
              listRef.once('value', function (listSnapshot) {
                  listSnapshot.forEach(function (listSnapshot) {
                      listSnapshot.child('listCards').forEach(function (cardSnapshot) {
                          var card = cardSnapshot.val();
                          if (card.timestamp != filterDateInput) {
                              cardSnapshot.ref.update({
                                  'show': false
                              });
                          }
                          else {
                              cardSnapshot.ref.update({
                                  'show': true
                              });
                          }
                      });
                  });
              });
          }
          else {
              alert("Enter a date.")
          }
        },
        clearFilter() {
          listRef.once('value', function (listSnapshot) {
              listSnapshot.forEach(function (listSnapshot) {
                  listSnapshot.child('listCards').forEach(function (cardSnapshot) {
                      var card = cardSnapshot.val();
                      cardSnapshot.ref.update({
                          'show': true
                      });
                  });
              });
          });
          this.filterDateInput = "";
        },
        closeModal: function(tag){
            document.getElementById(tag).style.display = "none";
        },
      
        toggle(){
          console.log(document.getElementsByClassName("listDisplay"));
          if (this.vert == false) {
              this.vert = true;
              for (var i = 0; i < this.lists.length; i++) {
                  document.getElementsByClassName("listDisplay")[i].setAttribute("class", "ver-list listDisplay");
                  document.getElementsByClassName("listDisplay")[i].classList.remove("hor-list");
              }
          }
          else {
              this.vert = false;
              for (var i = 0; i < this.lists.length; i++) {
                  document.getElementsByClassName("listDisplay")[i].setAttribute("class", "hor-list listDisplay");
                  document.getElementsByClassName("listDisplay")[i].classList.remove("ver-list");
              }
          }
        },
        logout(){
          this.enter = false;
          this.loginName = '';
          this.loginEmail = '';
          this.userEmail = '';
          this.userName = '';
        },
        changeInfo(){
          if (this.changeName && this.changeEmail) {
            var key = currentRef.child('key');
            currentRef.child('key').once('value').then(function (snapshot) {
              userRef.child(snapshot.val()).remove();
            })
            var changeKey = userRef.push({
              name: this.changeName
              , email: this.changeEmail
            }).key;
            currentRef.update({
              name: this.changeName
              , email: this.changeEmail
              , key: changeKey
            });
              this.changeInfoDone();       
            }else {
              alert('Input new name and email.')
            }
        },
        changeInfoDone(){
          this.changeEmail = ''
          this.changeName = ''
          this.changingInfo = false;
        },
        
        editCardTitle(list, card, cardIndex) {
          if (this.cardTitle) {
            
            listRef.child(list['.key']).child('listCards').child(cardIndex).update({
              ltitle:this.cardTitle
            });
            console.log(this.cardTitle);
            console.log("editing title ");
            this.editCardTitleDone(card);
          }else{
            alert("Enter Title");
          }
          
        }, 
        editCardTitleDone(card) {
          console.log("editing title done");
          card.editing = false;
          this.cardTitle = "";
        },    
        editDescription: function(replace, title, index){
            for(i=0; i<this.lists.length; i++){
               if(this.lists[i].ltitle == ltitle){
                   Vue.set(this.lists[i],this.lists[i].items[index].description, replace);
                   this.lists[i].items[index].description = replace;
               }
           }    
        },
        removeList(lis) { //done
          listRef.child(lis['.key']).remove();
          this.numList--;
        },
        removeCard(lis, c, cardIndex) { //done
          this.numCards--;
          listRef.child(lis['.key']).child('listCards').child(cardIndex).remove();
        },
        
    },
});
