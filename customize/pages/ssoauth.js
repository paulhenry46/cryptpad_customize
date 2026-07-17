// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/api/config',
    'jquery',
    '/common/hyperscript.js',
    '/common/common-interface.js',
    '/customize/messages.js',
    '/customize/pages.js'
], function (Config, $, h, UI, Msg, Pages) {

// --------------- BEGIN AURION EDITS -------------------------
(function() {
  let tempSecret = null;
  console.log("Loading SSO...");

  // Fonction utilitaire pour supprimer proprement la clé de manière asynchrone
  function deleteTempKeyFromDB() {
    const deleteReq = indexedDB.open("DriveAuth", 1);
    deleteReq.onsuccess = () => {
      const db = deleteReq.result;
      if (!db.objectStoreNames.contains("keys")) return;
      const tx = db.transaction("keys", "readwrite");
      const store = tx.objectStore("keys");
      store.delete("temp_key");
      console.log("IndexedDB: temp_key clean-up request sent.");
    };
  }

      // 1. Récupération du secret depuis IndexedDB
  const req = indexedDB.open("DriveAuth", 1);
  console.log("Attempting to load CryptDrive 1...");
  req.onsuccess = () => {
    console.log("Attempting to load CryptDrive 2...");
    const db = req.result;
    if (!db.objectStoreNames.contains("keys")){
      console.error("Attempting to load CryptDrive : error:", db);
      return;
    };
    console.log("Attempting to load CryptDrive 3...");
    const tx = db.transaction("keys", "readwrite");
    const store = tx.objectStore("keys");
    const getReq = store.get("temp_key");
    console.log("Attempting to load CryptDrive 4...");
    getReq.onsuccess = () => {
      console.log("IndexedDB retrieval result:", getReq.result);
      if (getReq.result) {
        // On stocke temporairement dans une variable locale à notre fonction
        tempSecret = getReq.result;
        window.CRYPTDRIVE_SECRET = tempSecret;
        console.log("CryptDrive secret loaded into temporary RAM. Watching DOM...");
        // On lance l'observation du DOM uniquement si on a récupéré un secret
        startDOMObserver();
      }
    };
  };


  // 2. Observation du DOM pour réagir aux formulaires ou à la connexion
  function startDOMObserver() {
    const observer = new MutationObserver((mutations, obs) => {
      // Cas A : Formulaire de mot de passe présent
      const passField = document.getElementById('password');
      const confirmField = document.getElementById('passwordconfirm');
      const submitBtn = document.getElementById('cp-ssoauth-button');

      if (passField && window.CRYPTDRIVE_SECRET) {
        // Injection du secret dans les champs de mot de passe
        passField.value = window.CRYPTDRIVE_SECRET;
        if (confirmField) {
          confirmField.value = window.CRYPTDRIVE_SECRET;
        }

        // On déclenche les événements pour que React/Vue/Cryptpad détecte le changement
        passField.dispatchEvent(new Event('input', { bubbles: true }));
        if (confirmField) {
          confirmField.dispatchEvent(new Event('input', { bubbles: true }));
        }

        setTimeout(() => {
        if (submitBtn) {
          console.log("Executing automatic submit click.");
          submitBtn.click();
        } else {
          console.error("Submit button lost during timeout.");
        }  
      }, 5000);


        console.log("Success: Secret injected into password fields.");
        
        // On coupe l'observeur, on nettoie la variable locale et on purge la DB
        window.CRYPTDRIVE_SECRET = null;
        return;
      }

      // Cas B : L'utilisateur est déjà connecté (présence du menu toolbar)
      const userMenu = document.querySelector('.cp-toolbar-user-dropdown');
      if (userMenu) {
        console.log("User already logged in. Destroying temporary secret.");
        // Le secret est détruit et purgé de la DB
        window.CRYPTDRIVE_SECRET = null;
        obs.disconnect();
        return;
      }
      const okModalBtn = document.querySelector('button.btn.ok.primary');
      if (okModalBtn) {
        console.log("Warning modal detected. Clicking OK button...");
        
        // Un léger délai pour s'assurer que la modale est prête à recevoir l'événement
        setTimeout(() => {
          okModalBtn.click();
          console.log("Success: Modal confirmed.");
        }, 2000);

        obs.disconnect();
        return;
      }

    });

    // On commence à écouter les changements sur tout le body
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Sécurité : On arrête d'observer après 30 secondes pour éviter de surcharger si rien ne se passe
    setTimeout(() => {
      if (window.CRYPTDRIVE_SECRET) {
        console.log("Timeout: Neither form nor session detected. Purging secret.");
        window.CRYPTDRIVE_SECRET = null;
      }
      observer.disconnect();
    }, 30000);
  }
})();
// --------------- END AURION EDITS -------------------------

    return function () {
        document.title = Msg.ssoauth_header;

        var frame = function (content) {
            return [
                h('div#cp-main', [
                    Pages.infopageTopbar(),
                    h('div.container.cp-container', [
                        h('div.row.cp-page-title', h('h1', Msg.ssoauth_header)),
                    ].concat(content)),
                    Pages.infopageFooter(),
                ]),
            ];
        };

        return frame([
            h('div.row', [
                h('div.hidden.col-md-3'),
                h('div#userForm.form-group.col-md-6.cp-ssoauth-pw', [
                    h('p.cp-isregister.cp-login-instance', Msg.ssoauth_form_hint_register),
                    h('p.cp-islogin.cp-login-instance', Msg.ssoauth_form_hint_login),
                    h('input.form-control#password', {
                        type: 'password',
                        placeholder: Msg.login_password,
                    }),
                    h('input.form-control.cp-isregister#passwordconfirm', {
                        type: 'password',
                        placeholder: Msg.login_confirm,
                    }),
                    h('div.cp-ssoauth-button.extra',
                        h('div'),
                        h('button.login#cp-ssoauth-button', Msg.continue)
                    )
                ]),
                h('div.hidden.col-md-3'),
            ])
        ]);
    };

});
