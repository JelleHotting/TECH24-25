const xssOptions = {
  whiteList: {}, // Standaard witlijst: alles is geblokkeerd
  stripIgnoreTag: true, // Verwijder tags die niet op de witlijst staan
  onIgnoreTag: function (tag, html) {
    return ""; // Verwijder ongewenste tags
  },
};

// Functie om invoer te saneren met XSS filtering
function sanitizeInput(input) {
  return filterXSS(input, xssOptions);
}
