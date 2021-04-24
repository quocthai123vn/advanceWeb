const socket = io()
var current_page = 1;
var records_per_page = 10;
var nofTable=document.getElementById('list')
let item=document.getElementsByClassName('item')
var temp=[]
for (var i=0;i<item.length;i++){
    temp.push(item[i])
}

socket.on('message',message=>{
    displayMessage(message)
})

function displayMessage(message){
    var p=document.getElementById('msg')
    p.href=`/notification/${message}`
    document.getElementById('newNotification').style.visibility = "visible";
}

$(document).ready(function(){
    $('#icon').click(function(){
        $('ul').toggleClass('show');
    })
    $(".successMessage").fadeOut(5555);
    $("#newNotification").fadeOut(10000);
})

function onSignIn(googleUser) {
    var id_token = googleUser.getAuthResponse().id_token;
    var xhr = new XMLHttpRequest();
    xhr.open('POST','/gglogin');
    xhr.setRequestHeader('Content-Type','application/json');
    xhr.onload=function(){
        location.assign('/register')
        signOut()
    }
    xhr.send(JSON.stringify({token:id_token}));
 }

 function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
        console.log('Create Success')
    }
)}



function prevPage()
{
    if (current_page > 1) {
        current_page--;
        changePage(current_page);
    }
}

function nextPage()
{
    if (current_page < numPages()) {
        current_page++;
        changePage(current_page);
    }
}

function changePage(page)
{
    var btn_next = document.getElementById("btn_next");
    var btn_prev = document.getElementById("btn_prev");
    if(item.length===0){
        nofTable.innerHTML="<p>Không tìm thấy kết quả nào</p><br>"
        btn_prev.style.visibility = "hidden";
        btn_next.style.visibility = "hidden";
    }
    else{
        var page_span = document.getElementById("page")

        // Validate page
        if (page < 1) page = 1;
        if (page > numPages()) page = numPages();

        nofTable.innerHTML=""
        for (var i = (page-1) * records_per_page; i < (page * records_per_page) && i < temp.length; i++) {
            nofTable.innerHTML += temp[i].outerHTML+"<br>";
        }
        page_span.innerHTML = page;

        if (page == 1) {
            btn_prev.style.visibility = "hidden";
        } else {
            btn_prev.style.visibility = "visible";
        }

        if (page == numPages()) {
            btn_next.style.visibility = "hidden";
        } else {
            btn_next.style.visibility = "visible";
        }
    } 
}

function numPages()
{
    return Math.ceil(temp.length / records_per_page);
}
window.onload = function() {
    changePage(1);
};


    



  



 
