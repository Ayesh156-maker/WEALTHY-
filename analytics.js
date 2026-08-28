import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyBASJQed83D5iCtGOYES8LfqAv5M0iwUaM",
  authDomain: "mylamborghini.firebaseapp.com",
  projectId: "mylamborghini",
  storageBucket: "mylamborghini.firebasestorage.app",
  messagingSenderId: "817085836076",
  appId: "1:817085836076:web:dafa36f41d1ec24a5c5a89"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);


const provider = new GoogleAuthProvider();

let ordersChart;
let revenueChart;
onAuthStateChanged(auth, async(user)=>{

  const profileBox =
    document.getElementById("profileBox");

  const loginBtn =
    document.getElementById("loginBtn");

  if(user){

    profileBox.style.display = "flex";
    loginBtn.style.display = "none";

    document.getElementById("userPhoto").src =
      user.photoURL || "";

    document.getElementById("userName").innerText =
      user.displayName || "User";

    document.getElementById("userEmail").innerText =
      user.email;

    loadAnalytics(
      user.email.toLowerCase().trim()
    );

  }else{

    profileBox.style.display = "none";
    loginBtn.style.display = "block";

  }

});
window.googleLogin = async () => {
  try{
    await signInWithPopup(auth, provider);
  }catch(err){
    console.error(err);
  }
};

window.logout = async () => {
  await signOut(auth);
};
window.logout = async () => {

  await signOut(auth);

  localStorage.removeItem("sellerEmail");

};
async function loadAnalytics(email){

  const productQuery = query(
    collection(db,"products"),
    where("email","==",email)
  );

  const productSnap = await getDocs(productQuery);

  let totalProducts = productSnap.size;

  onSnapshot(collection(db,"orders"),(snapshot)=>{

    let totalOrders = 0;
    let totalRevenue = 0;

    const monthlyOrders = {
      Jan:0, Feb:0, Mar:0, Apr:0,
      May:0, Jun:0, Jul:0, Aug:0,
      Sep:0, Oct:0, Nov:0, Dec:0
    };

    const monthlyRevenue = {
      Jan:0, Feb:0, Mar:0, Apr:0,
      May:0, Jun:0, Jul:0, Aug:0,
      Sep:0, Oct:0, Nov:0, Dec:0
    };

    snapshot.forEach(docSnap=>{

      const order = docSnap.data();

      if(!order.cart) return;

      order.cart.forEach(item=>{

        if(item.sellerEmail === email){

          totalOrders++;

          const price = Number(item.price || 0);

          totalRevenue += price;

          const date = order.createdAt
            ? new Date(order.createdAt.toDate?.() || order.createdAt)
            : new Date();

          const month =
            date.toLocaleString("en-US",{month:"short"});

          monthlyOrders[month]++;
          monthlyRevenue[month]+=price;
        }
      });

    });

    document.getElementById("totalOrders").innerText =
      totalOrders;

    document.getElementById("totalViews").innerText =
      totalProducts;

    const conversion =
      totalProducts > 0
      ? ((totalOrders/totalProducts)*100).toFixed(1)
      : 0;

    document.getElementById("conversionRate").innerText =
      conversion + "%";

    createOrdersChart(
      Object.keys(monthlyOrders),
      Object.values(monthlyOrders)
    );

    createRevenueChart(
      Object.keys(monthlyRevenue),
      Object.values(monthlyRevenue)
    );

  });

}
function createOrdersChart(labels,data){

  const ctx = document.getElementById("ordersChart");

  if(ordersChart) ordersChart.destroy();

  const gradient = ctx.getContext("2d")
    .createLinearGradient(0,0,0,400);

  gradient.addColorStop(0,"#FFD700");
  gradient.addColorStop(1,"#B8860B");

  ordersChart = new Chart(ctx,{
    type:"bar",
    data:{
      labels,
      datasets:[{
        label:"Orders",
        data,
        backgroundColor: gradient,
        borderColor:"#FFD700",
        borderWidth:2,
        borderRadius:15,
        borderSkipped:false
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,

      plugins:{
        legend:{
          labels:{
            color:"#fff"
          }
        }
      },

      scales:{
        x:{
          ticks:{
            color:"#fff"
          },
          grid:{
            color:"rgba(255,255,255,0.05)"
          }
        },
        y:{
          ticks:{
            color:"#fff"
          },
          grid:{
            color:"rgba(255,255,255,0.05)"
          }
        }
      }
    }
  });

}
function createRevenueChart(labels,data){

  const ctx = document.getElementById("revenueChart");

  if(revenueChart) revenueChart.destroy();

  const gradient = ctx.getContext("2d")
    .createLinearGradient(0,0,0,400);

  gradient.addColorStop(0,"rgba(255,215,0,0.6)");
  gradient.addColorStop(1,"rgba(255,215,0,0)");

  revenueChart = new Chart(ctx,{
    type:"line",
    data:{
      labels,
      datasets:[{
        label:"Revenue (Rs)",
        data,

        borderColor:"#FFD700",
        backgroundColor:gradient,

        fill:true,

        tension:0.45,

        borderWidth:4,

        pointRadius:6,
        pointHoverRadius:10,

        pointBackgroundColor:"#ffffff",
        pointBorderColor:"#FFD700",
        pointBorderWidth:3
      }]
    },

    options:{
      responsive:true,
      maintainAspectRatio:false,

      interaction:{
        mode:"index",
        intersect:false
      },

      plugins:{
        legend:{
          labels:{
            color:"#fff"
          }
        }
      },

      scales:{
        x:{
          ticks:{
            color:"#fff"
          },
          grid:{
            color:"rgba(255,255,255,0.05)"
          }
        },

        y:{
          ticks:{
            color:"#fff"
          },
          grid:{
            color:"rgba(255,255,255,0.05)"
          }
        }
      }
    }
  });

}