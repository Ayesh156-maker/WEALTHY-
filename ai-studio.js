import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";


import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} 
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";


import {
    getFirestore,
    doc,
    getDoc,
    updateDoc,
    increment
}
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";



// FIREBASE CONFIG

const firebaseConfig = {

apiKey:"AIzaSyBASJQed83D5iCtGOYES8LfqAv5M0iwUaM",

authDomain:"mylamborghini.firebaseapp.com",

projectId:"mylamborghini",

storageBucket:"mylamborghini.firebasestorage.app",

messagingSenderId:"817085836076",

appId:"1:817085836076:web:dafa36f41d1ec24a5c5a89",

measurementId:"G-RY79N9C9R1"

};




// INIT FIREBASE

const app = initializeApp(firebaseConfig);


const auth = getAuth(app);


const db = getFirestore(app);



const provider = new GoogleAuthProvider();



let currentUser = null;




// HTML ELEMENTS

const loginBtn=document.getElementById("loginBtn");

const logoutBtn=document.getElementById("logoutBtn");

const userName=document.getElementById("userName");

const creditsBox=document.getElementById("credits");





// LOGIN BUTTON


if(loginBtn){

loginBtn.onclick=async()=>{


try{


await signInWithPopup(
auth,
provider
);


}
catch(error){


console.log(error.message);


}


};


}





// LOGOUT BUTTON


if(logoutBtn){


logoutBtn.onclick=async()=>{


await signOut(auth);


};


}






// AUTH STATE


onAuthStateChanged(auth,async(user)=>{


if(user){


currentUser=user;



if(loginBtn)
loginBtn.style.display="none";



if(logoutBtn)
logoutBtn.style.display="inline-block";



if(userName)
userName.innerHTML=
"Hi "+(user.displayName || user.email);





const userRef=doc(
db,
"users",
user.uid
);



const snap=await getDoc(userRef);



if(snap.exists()){


const data=snap.data();



if(creditsBox){

creditsBox.innerText=
data.aiCredits || 0;

}


}



}

else{


currentUser=null;



if(loginBtn)
loginBtn.style.display="inline-block";



if(logoutBtn)
logoutBtn.style.display="none";



if(userName)
userName.innerHTML="Guest User";



}


});








// GENERATE IMAGE


async function generateImage(){


const prompt=
document.getElementById("prompt")
.value
.trim();



const result=
document.getElementById("result");


const loader=
document.getElementById("loader");



if(!prompt){


showToast("Enter your artwork idea");

return;


}



if(!currentUser){


showToast("Please login first");

return;


}





const userRef=
doc(
db,
"users",
currentUser.uid
);



const snap=
await getDoc(userRef);



if(!snap.exists()){


showToast("User profile not found");

return;


}



let credits=
snap.data().aiCredits || 0;




if(credits<=0){


showToast("No AI credits");

return;


}





loader.style.display="block";


result.innerHTML="";





try{


const response=
await fetch(
"http://127.0.0.1:5000/generate",
{


method:"POST",


headers:{


"Content-Type":"application/json"


},


body:JSON.stringify({

prompt:prompt

})


});





const data=
await response.json();




loader.style.display="none";




if(data.success){



await updateDoc(
userRef,
{


aiCredits:increment(-1),


totalGenerated:increment(1)


});





creditsBox.innerText=
credits-1;






result.innerHTML=`

<h3>Your AI Artwork</h3>


<img 
src="http://127.0.0.1:5000/generated.png?t=${Date.now()}"
width="400"
>


<br><br>


<button onclick="downloadImage()">

Download

</button>

`;



}

else{


result.innerHTML="❌ Generation Failed";


}





}

catch(error){


console.log(error);


loader.style.display="none";


result.innerHTML=
"❌ Backend Error";


}



}








function downloadImage(){


window.open(

"http://127.0.0.1:5000/generated.png",

"_blank"

);


}





window.generateImage=
generateImage;


window.downloadImage=
downloadImage;
