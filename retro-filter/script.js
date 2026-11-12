// Démonstration : barre de comparaison et choix de carte, de mode et de palette.
// Les 16 images (8 palettes x 2 modes) sont des sorties de l'app, montrées à taille réelle.
// Le même script sert à la page française et à la page anglaise (attribut lang de la page).
(function () {
  "use strict";

  var anglais = document.documentElement.lang === "en";
  function t(fr, en) { return anglais ? en : fr; }

  // Les images sont à côté de ce script, quelle que soit la page qui le charge.
  var images = new URL("img/", document.currentScript.src).href;

  // Les 16 couleurs CGA / EGA, dans l'ordre de la carte.
  var C = ["#000000", "#0000aa", "#00aa00", "#00aaaa", "#aa0000", "#aa00aa", "#aa5500", "#aaaaaa",
           "#555555", "#5555ff", "#55ff55", "#55ffff", "#ff5555", "#ff55ff", "#ffff55", "#ffffff"];
  function couleurs(index) { return index.map(function (i) { return C[i]; }); }

  var cartes = [
    {
      nom: "CGA", fichier: "cga", detail: t("4 couleurs (1981)", "4 colors (1981)"),
      palettes: [
        { nom: t("cyan, magenta, blanc", "cyan, magenta, white"), fichier: "pal1-haute", couleurs: couleurs([0, 11, 13, 15]) },
        { nom: t("cyan, magenta, gris (sombre)", "cyan, magenta, gray (dark)"), fichier: "pal1-basse", couleurs: couleurs([0, 3, 5, 7]) },
        { nom: t("vert, rouge, jaune", "green, red, yellow"), fichier: "pal0-haute", couleurs: couleurs([0, 10, 12, 14]) },
        { nom: t("vert, rouge, marron (sombre)", "green, red, brown (dark)"), fichier: "pal0-basse", couleurs: couleurs([0, 2, 4, 6]) },
        { nom: t("cyan, rouge, blanc", "cyan, red, white"), fichier: "mode5", couleurs: couleurs([0, 11, 12, 15]) },
        { nom: t("gris", "grayscale"), fichier: "gris", couleurs: couleurs([0, 8, 7, 15]) }
      ]
    },
    {
      nom: "EGA", fichier: "ega", detail: t("16 couleurs (1984)", "16 colors (1984)"),
      palettes: [
        { nom: t("16 couleurs", "16 colors"), fichier: "16-couleurs", couleurs: C },
        { nom: t("gris", "grayscale"), fichier: "gris", couleurs: couleurs([0, 8, 7, 15]) }
      ]
    }
  ];
  var modes = [
    { nom: t("Moderne", "Modern"), fichier: "moderne", detail: t("tramage fin, à la résolution de l'écran", "fine dithering, at screen resolution") },
    { nom: t("Historique", "Period"), fichier: "historique", detail: t("320×200, gros pixels comme à l'époque", "320×200, chunky pixels like the real thing") }
  ];

  // Une palette retenue par carte, comme dans l'app.
  var etat = { carte: 0, mode: 0, palettes: [0, 0] };

  var ecran = document.getElementById("ecran");
  var filtre = document.getElementById("couche-filtre");
  var glissiere = document.getElementById("glissiere");
  var zones = {
    carte: document.getElementById("choix-carte"),
    mode: document.getElementById("choix-mode"),
    palette: document.getElementById("choix-palette")
  };
  var details = {
    carte: document.getElementById("detail-carte"),
    mode: document.getElementById("detail-mode"),
    palette: document.getElementById("detail-palette")
  };

  function fichier(carte, mode, palette) {
    return images + carte.fichier + "-" + mode.fichier + "-" + palette.fichier + ".png";
  }

  function bouton(texte, choisi, action) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = texte;
    b.setAttribute("aria-pressed", choisi ? "true" : "false");
    b.addEventListener("click", action);
    return b;
  }

  function pastille(palette, choisie, action) {
    var b = bouton("", choisie, action);
    b.className = "pastille" + (palette.couleurs.length > 4 ? " seize" : "");
    b.setAttribute("aria-label", t("Palette ", "Palette: ") + palette.nom);
    b.title = palette.nom;
    palette.couleurs.forEach(function (couleur) {
      var bande = document.createElement("i");
      bande.style.background = couleur;
      b.appendChild(bande);
    });
    return b;
  }

  function afficher() {
    var carte = cartes[etat.carte];
    var mode = modes[etat.mode];
    var palette = carte.palettes[etat.palettes[etat.carte]];

    filtre.style.backgroundImage = 'url("' + fichier(carte, mode, palette) + '")';
    filtre.setAttribute("aria-label", t(
      "La scène filtrée : " + carte.nom + ", mode " + mode.nom.toLowerCase() + ", palette " + palette.nom,
      "The filtered scene: " + carte.nom + ", " + mode.nom.toLowerCase() + " mode, palette " + palette.nom));

    zones.carte.replaceChildren.apply(zones.carte, cartes.map(function (c, i) {
      return bouton(c.nom, i === etat.carte, function () { etat.carte = i; afficher(); zones.carte.children[i].focus(); });
    }));
    zones.mode.replaceChildren.apply(zones.mode, modes.map(function (m, i) {
      return bouton(m.nom, i === etat.mode, function () { etat.mode = i; afficher(); zones.mode.children[i].focus(); });
    }));
    zones.palette.replaceChildren.apply(zones.palette, carte.palettes.map(function (p, i) {
      return pastille(p, i === etat.palettes[etat.carte], function () {
        etat.palettes[etat.carte] = i;
        afficher();
        zones.palette.children[i].focus();
      });
    }));

    details.carte.textContent = carte.detail;
    details.mode.textContent = mode.detail;
    details.palette.textContent = palette.nom;
  }

  glissiere.addEventListener("input", function () {
    ecran.style.setProperty("--pos", glissiere.value + "%");
  });

  // Un point d'image doit couvrir un nombre entier de points de l'écran, sinon le tramage
  // se brouille (écran réglé à 125 % ou 150 %, par exemple).
  function regler() {
    var densite = window.devicePixelRatio || 1;
    var echelle = Math.max(1, Math.round(densite)) / densite;
    document.documentElement.style.setProperty("--echelle", echelle);
  }
  window.addEventListener("resize", regler);

  // Charge les autres images à l'avance pour que le changement soit immédiat.
  window.addEventListener("load", function () {
    cartes.forEach(function (carte) {
      carte.palettes.forEach(function (palette) {
        modes.forEach(function (mode) { new Image().src = fichier(carte, mode, palette); });
      });
    });
  });

  regler();
  afficher();
})();
