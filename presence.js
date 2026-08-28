import {
  ref,
  set,
  onDisconnect,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

export async function setupPresence(realtimeDB, user) {

    const statusRef = ref(realtimeDB, "presence/" + user.uid);

    // Chat page open
    await set(statusRef,{
        online:true,
        lastSeen:serverTimestamp()
    });

    // Browser/tab close
    onDisconnect(statusRef).set({
        online:false,
        lastSeen:serverTimestamp()
    });

    // User leaves chat page
    window.addEventListener("beforeunload",async ()=>{

        await set(statusRef,{
            online:false,
            lastSeen:serverTimestamp()
        });

    });

}