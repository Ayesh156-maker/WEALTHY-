// Smooth reveal animation


const elements =
document.querySelectorAll(
".card,.gallery img,.hero-text"
);


window.addEventListener(
"scroll",
()=>{


elements.forEach(el=>{


let pos =
el.getBoundingClientRect().top;


if(pos < window.innerHeight-100){

el.style.opacity="1";

el.style.transform="translateY(0)";

}


});


});



elements.forEach(el=>{

el.style.opacity="0";

el.style.transform=
"translateY(50px)";

el.style.transition=
"1s";


});