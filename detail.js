// firebase-config.js
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const auth = getAuth();
let customerId = null;

export async function getCustomerId() {
  return new Promise(resolve => {
    if (auth.currentUser) resolve(auth.currentUser.uid);
    else {
      signInAnonymously(auth).then(cred => resolve(cred.user.uid));
    }
  });
}

// Hoặc nếu muốn sync:
onAuthStateChanged(auth, user => {
  customerId = user ? user.uid : null;
});
