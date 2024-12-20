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
fetch('maison.geojson')
    .then((response) => response.json())
    .then((data) => {
        geojsonData = data;

    })
    .catch((error) => console.error('Erreur lors du chargement des données GeoJSON :', error));

// Fonction pour rechercher une maison par avenue et numéro
function rechercherMaison(query) {
    if (!geojsonData) {
        alert("Les données GeoJSON ne sont pas encore chargées.");
        return;
    }

    // Convertir la requête en minuscule et la découper
    const [avenue, numero] = query.split(/[\s,]+/).map(item => item.trim().toLowerCase());

    console.log("Requête : ", { avenue, numero }); // Débogage de la requête

    // Trouver la maison correspondante
    const feature = geojsonData.features.find(f => {
        console.log("Comparaison avec : ", f.properties); // Débogage des données
        return (
            f.properties.avenue.toLowerCase() === avenue && // Conversion en minuscule
            f.properties.numero.toLowerCase() === numero   // Conversion en minuscule
        );
    });

    if (feature) {
        const coords = feature.geometry.coordinates;

        // Centrer la carte sur la maison recherchée
        map.setView([coords[1], coords[0]], 18);

        // Supprimer l'ancien marqueur s'il existe
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }

        // Ajouter le marqueur pour la maison trouvée
        currentMarker = L.marker([coords[1], coords[0]], { icon: animatedIcon() }).addTo(map)
            .bindPopup(`Maison trouvée !<br>Avenue : ${feature.properties.avenue}<br>Numéro : ${feature.properties.numero}`)
            .openPopup();
    } else {
        alert("Maison introuvable. Vérifiez les informations !");
    }
}


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
