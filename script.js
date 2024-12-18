// Initialiser la carte avec une vue par défaut (centrée sur Goma)
const map = L.map('map').setView([-1.6933, 29.2452], 50);  // Position par défaut avant la géolocalisation

// Ajouter la couche OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Vérifier si la géolocalisation est supportée
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
        // Récupérer la latitude et la longitude de la position actuelle
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        // Centrer la carte sur la position actuelle de l'utilisateur
        map.setView([latitude, longitude], 13); // 13 est le niveau de zoom, ajustez selon vos préférences

        // Ajouter un marqueur à la position actuelle
        L.marker([latitude, longitude]).addTo(map)
            .bindPopup("Vous êtes ici")
            .openPopup();
    }, function(error) {
        // Si la géolocalisation échoue, afficher une erreur dans la console
        console.error("Erreur de géolocalisation : ", error);
    });
} else {
    alert("La géolocalisation n'est pas supportée par votre navigateur.");
}

// Charger un fichier GeoJSON (si sélectionné)
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            const data = JSON.parse(content);
            L.geoJSON(data).addTo(map);
            map.fitBounds(L.geoJSON(data).getBounds());
        };
        reader.readAsText(file);
    }
});