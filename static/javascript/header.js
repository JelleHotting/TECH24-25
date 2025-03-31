
document.addEventListener("DOMContentLoaded", function () {


  const hamburger = document.getElementById("hamburger");
  const navLinks = document.querySelector(".nav-links");
  const navItems = document.querySelectorAll(".nav-links a"); 

  
  hamburger.addEventListener("click", function () {
    // Zet de klasse "active" aan of uit 
    hamburger.classList.toggle("active");
    navLinks.classList.toggle("active");
    document.body.classList.toggle("menu-open"); 
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

});