// ================= FIREBASE IMPORTS =================

import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
getAuth,
GoogleAuthProvider,
signInWithPopup,
signInWithEmailAndPassword,
createUserWithEmailAndPassword
}
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
getFirestore,
doc,
setDoc,
serverTimestamp
}
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


// ================= FIREBASE CONFIG =================

const firebaseConfig = {
apiKey: "AIzaSyBASJQed83D5iCtGOYES8LfqAv5M0iwUaM",
authDomain: "mylamborghini.firebaseapp.com",
projectId: "mylamborghini",
storageBucket: "mylamborghini.firebasestorage.app",
messagingSenderId: "817085836076",
appId: "1:817085836076:web:dafa36f41d1ec24a5c5a89",
measurementId: "G-RY79N9C9R1"
};


// ================= INITIALIZE =================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// ================= GOOGLE LOGIN =================

const googleBtn = document.getElementById("googleLogin");

if(googleBtn){

googleBtn.addEventListener("click", async()=>{

const provider = new GoogleAuthProvider();

try{

const result = await signInWithPopup(auth,provider);

const user = result.user;

await setDoc(
doc(db,"artists",user.uid),
{
uid:user.uid,
name:user.displayName,
email:user.email,
profilePhoto:user.photoURL,
status:"pending",
createdAt:serverTimestamp()
},
{
merge:true
}
);

showToast("Google Login Successful!");

window.location.href="dashboard.html";

}

catch(error){

console.log(error);

showToast(error.message);

}

});

}


// ================= EMAIL LOGIN =================

const loginBtn = document.querySelector(".login-btn");

if(loginBtn){

loginBtn.addEventListener("click",async()=>{


const email = document.getElementById("email").value.trim();

const password = document.getElementById("password").value.trim();


if(!email || !password){

showToast("Please enter your right details here.");

return;

}


try{


const result = await signInWithEmailAndPassword(
auth,
email,
password
);


const user = result.user;


await setDoc(
doc(db,"artists",user.uid),
{
uid:user.uid,
name:user.displayName || email.split("@")[0],
email:user.email,
profilePhoto:user.photoURL || "",
status:"pending",
lastLogin:serverTimestamp()
},
{
merge:true
}
);


showToast("Login Successful!");


window.location.href="dashboard.html";


}


catch(error){

console.log(error.code);

showToast(error.message);

}


});

}


// ================= EMAIL SIGNUP =================

const signupBtn = document.querySelector(".signup-btn");


if(signupBtn){

signupBtn.addEventListener("click",async()=>{


const email = document.getElementById("email").value.trim();

const password = document.getElementById("password").value.trim();


if(!email || !password){

showToast("Please enter email and password");

return;

}


try{


const result = await createUserWithEmailAndPassword(
auth,
email,
password
);


const user = result.user;


await setDoc(
doc(db,"artists",user.uid),
{
uid:user.uid,
name:email.split("@")[0],
email:email,
profilePhoto:"",
status:"pending",
createdAt:serverTimestamp()
},
{
merge:true
}
);


showToast("Account Created Successfully!");


window.location.href="dashboard.html";


}


catch(error){

console.log(error.code);

showToast(error.message);

}


});

}