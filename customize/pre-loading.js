// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

(function () {
var logoPath = '/customize/CryptPad_logo_grey.svg';
// --------------- BEGIN AURION EDITS (NO CUSTOMIZATION) -------------------------
(function() {
  const req = indexedDB.open("DriveAuth", 1);
  req.onsuccess = () => {
    const db = req.result;
    // On vérifie que le store "keys" créé par l'iframe existe bien
    if (!db.objectStoreNames.contains("keys")) return;

    const tx = db.transaction("keys", "readwrite");
    const store = tx.objectStore("keys");
    const getReq = store.get("temp_key");

    getReq.onsuccess = () => {
      if (getReq.result) {
        // 1. Passage du secret en RAM pour CryptPad
        window.CRYPTDRIVE_SECRET = getReq.result;
        console.log("Success: CryptDrive secret loaded into RAM.");
        
        store.delete("temp_key");
      }
    };
  };
})();
// --------------- END AURION EDITS -------------------------
var elem = document.createElement('div');
elem.setAttribute('id', 'placeholder');
elem.innerHTML = `
<div></div>
<div class="placeholder-message-container">
    <p>Loading...</p>
</div>
<div id="placeholder-loading-footer">
    <div class="placeholder-logo-container">
        <img class="placeholder-logo" alt="" aria-hidden="true" src="${logoPath}"><span>CryptPad</span>
    </div>
    <div id="placeholder-loading-status">
        <i data-lucide="lock" aria-hidden="true"></i>
        <span>End-to-end encrypted</span>
    </div>
</div>
`;

var key = 'CRYPTPAD_STORE|colortheme'; // handle outer
if (localStorage[key] && localStorage[key] === 'dark') {
    elem.classList.add('dark-theme');
}
if (!localStorage[key] && localStorage[key+'_default'] && localStorage[key+'_default'] === 'dark') {
    elem.classList.add('dark-theme');
}

var req;
try {
    req = JSON.parse(decodeURIComponent(window.location.hash.substring(1)));
    if ((req.theme || req.themeOS) === 'dark') { // handle inner
        elem.classList.add('dark-theme');
    }
} catch (e) {}

document.addEventListener('DOMContentLoaded', function() {
/* ////--------------------- BEGIN AURION EDITS -------------------------
var intervalTest = setInterval(function() {
    var nameField = document.getElementById('name');
    var passField = document.getElementById('password');

    if (nameField && passField) {
        nameField.value = "username";
        passField.value = "password";
        
        nameField.dispatchEvent(new Event('input', { bubbles: true }));
        passField.dispatchEvent(new Event('input', { bubbles: true }));

        console.log("Success : Values injected.");
        clearInterval(intervalTest); // On arrête l'observateur une fois fait
    }
}, 200);

// Stop after 10 seconds if the fields are not found
setTimeout(function() { clearInterval(intervalTest); }, 10000);
///--------------------- END AURION EDITS ------------------------- */


    document.body.appendChild(elem);
    window.CP_preloadingTime = +new Date();

    // soft transition between inner and outer placeholders
    if (req && req.time && (+new Date() - req.time > 2000)) {
        try {
            var logo = document.querySelector('.placeholder-logo-container');
            var message = document.querySelector('.placeholder-message-container');
            logo.style.opacity = 100;
            message.style.opacity = 100;
            logo.style.animation = 'none';
            message.style.animation = 'none';
        } catch (err) {}
    }

    // fallback if CSS animations not available
    setTimeout(() => {
        try {
            document.querySelector('.placeholder-logo-container').style.opacity = 100;
            document.querySelector('.placeholder-message-container').style.opacity = 100;
        } catch (e) {}
    }, 3000);
});
}());
