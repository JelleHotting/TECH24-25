// Wacht tot de hele pagina is geladen
document.addEventListener("DOMContentLoaded", function () {

  // Zoek het hamburger-icoon en het navigatiemenu in de HTML
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.querySelector(".nav-links");
  const navItems = document.querySelectorAll(".nav-links a"); // Alle links in het menu

  // Als je op het hamburger-icoon klikt:
  hamburger.addEventListener("click", function () {
    // Zet de klasse "active" aan of uit (voor animatie en tonen menu)
    hamburger.classList.toggle("active");
    navLinks.classList.toggle("active");
    document.body.classList.toggle("menu-open"); // Je kunt dit gebruiken om scrollen te blokkeren
  });

  // Als je op een van de menu-links klikt:
  navItems.forEach(function (link) {
    link.addEventListener("click", function () {
      // Sluit het menu door de "active"-klasse weg te halen
      hamburger.classList.remove("active");
      navLinks.classList.remove("active");
      document.body.classList.remove("menu-open");
    });
  });

// als je ergens anders op de pagina klikt (niet op het menu)
  document.addEventListener("click", function (event) {
    // Check of je NIET op het hamburger-icoon of menu hebt geklikt
    const klikBinnenMenu = hamburger.contains(event.target) || navLinks.contains(event.target);

    if (!klikBinnenMenu && navLinks.classList.contains("active")) {
      // Sluit het menu
      hamburger.classList.remove("active");
      navLinks.classList.remove("active");
      document.body.classList.remove("menu-open");
    }
  });

});