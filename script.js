// Initialisation de la carte
const map = L.map('map').setView([-1.6933, 29.2452], 13); // Position par défaut avant la géolocalisation

// Ajouter la couche OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Variables globales pour gérer les marqueurs et itinéraires
let currentMarker = null;
let currentRoute = null;
let geojsonLayer = null;
let geojsonData = null;

// Chargement automatique du fichier GeoJSON
fetch('donnee.geojson')
    .then((response) => response.json())
    .then((data) => {
        geojsonData = data;

    })
    .catch((error) => console.error('Erreur lors du chargement des données GeoJSON :', error));

// Fonctionpour chercher un lieu
function rechercherMaison(query) {
        if (!geojsonData) {
            alert("Les données GeoJSON ne sont pas encore chargées.");
            return;
        }
    
        // Convertir la requête en minuscule
        const queryLower = query.trim().toLowerCase();
        console.log("Requête : ", queryLower); // Débogage de la requête
    
        // Trouver les lieux correspondants
        const matchingFeatures = geojsonData.features.filter(f => {
            console.log("Comparaison avec : ", f.properties); // Débogage des données
            // Vérifier si l'une des propriétés correspond à la requête
            return Object.values(f.properties).some(value =>
                value.toLowerCase && value.toLowerCase().includes(queryLower)
            );
        });
    
        // Si des lieux sont trouvés
        if (matchingFeatures.length > 0) {
            // Si un seul lieu correspond, zoomer sur ce lieu
            if (matchingFeatures.length === 1) {
                const coords = matchingFeatures[0].geometry.coordinates;
                map.setView([coords[1], coords[0]], 18);
    
                // Supprimer l'ancien marqueur s'il existe
                if (currentMarker) {
                    map.removeLayer(currentMarker);
                }
    
                // Ajouter un marqueur pour le lieu trouvé
                currentMarker = L.marker([coords[1], coords[0]], { icon: animatedIcon() }).addTo(map)
                    .bindPopup(`Lieu trouvé !<br>Quartier : ${matchingFeatures[0].properties.Quartier} <br>Avenue : ${matchingFeatures[0].properties.avenue} <br>Type : ${matchingFeatures[0].properties.icon}`)
                    .openPopup();
            } else {
                // Afficher tous les lieux correspondants
                matchingFeatures.forEach(feature => {
                    const coords = feature.geometry.coordinates;
                    const name = feature.properties.bar || feature.properties.ecole || feature.properties.entreprise || feature.properties.boutique || feature.properties.eglise;
                    
                    L.marker([coords[1], coords[0]], { icon: animatedIcon() }).addTo(map)
                        .bindPopup(`Lieu : ${name}<br>Quartier : ${feature.properties.Quartier}`)
                        .openPopup();
                });
            }
        } else {
            alert("Aucun lieu trouvé correspondant à la recherche.");
        }
}    

// Attacher l'écouteur d'événement après la définition de la fonction
document.getElementById('searchInput').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        const query = event.target.value.trim();
        if (query) {
            rechercherMaison(query);
        }
    }
});

// Icône animée pour la maison recherchée
function animatedIcon() {
    return L.divIcon({
        className: 'animated-icon',
        html: '<div class="heart"></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    });
}

// Ajouter un écouteur pour la barre de recherche
document.getElementById('searchInput').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        const query = event.target.value.trim();
        if (query) {
            rechercherMaison(query);
        }
    }
});

// Fonction de géocodage pour une recherche générique
function geocodeLocation(location) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&addressdetails=1`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const latitude = data[0].lat;
                const longitude = data[0].lon;
                const placeName = data[0].display_name;

                map.setView([latitude, longitude], 13);

                if (currentMarker) {
                    map.removeLayer(currentMarker);
                }

                currentMarker = L.marker([latitude, longitude]).addTo(map)
                    .bindPopup(placeName)
                    .openPopup();
            } else {
                alert("Lieu introuvable.");
            }
        })
        .catch(error => console.error("Erreur lors du géocodage : ", error));
}

// Localiser la position actuelle
document.getElementById('locateBtn').addEventListener('click', function () {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            map.setView([latitude, longitude], 13);

            if (currentMarker) {
                map.removeLayer(currentMarker);
            }

            currentMarker = L.marker([latitude, longitude]).addTo(map)
                .bindPopup("Vous êtes ici")
                .openPopup();
        });
    } else {
        alert("La géolocalisation n'est pas supportée par votre navigateur.");
    }
});

// CSS pour le cœur animé
const style = document.createElement('style');
style.innerHTML = `
.animated-icon .heart {
    width: 20px;
    height: 20px;
    background: red;
    border-radius: 50%;
    animation: heartbeat 1s infinite;
}

@keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.3); }
}
`;
document.head.appendChild(style);
