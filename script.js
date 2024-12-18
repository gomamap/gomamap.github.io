// Initialisation des éléments HTML pour l'écran de chargement


// Initialisation de la carte
const map = L.map('map').setView([-1.6933, 29.2452], 13); // Position par défaut avant la géolocalisation

// Ajouter la couche OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Cacher l'écran de chargement une fois que la carte est prête
map.on('load', () => {
    clearTimeout(loadingTimeout);
    loadingScreen.style.display = 'none'; // Masquer l'écran de chargement
    clearInterval(progressInterval);
});

// Si le chargement prend plus de 5 secondes, afficher un message d'erreur
loadingTimeout = setTimeout(() => {
    loadingScreen.style.display = 'none';
    errorMessage.style.display = 'block';
}, 5000);

// Variables globales pour gérer le marqueur et l'itinéraire
let currentMarker = null;
let currentRoute = null;

// Fonction de géocodage via Nominatim (OpenStreetMap)
function geocodeLocation(location) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&addressdetails=1`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const latitude = data[0].lat;
                const longitude = data[0].lon;
                const placeName = data[0].display_name;

                // Centrer la carte sur la position recherchée
                map.setView([latitude, longitude], 13);

                // Effacer l'ancien marqueur si présent
                if (currentMarker) {
                    map.removeLayer(currentMarker);
                }

                // Ajouter un nouveau marqueur
                currentMarker = L.marker([latitude, longitude]).addTo(map)
                    .bindPopup(placeName)
                    .openPopup();
            } else {
                alert("Lieu introuvable.");
            }
        })
        .catch(error => console.error("Erreur lors du géocodage : ", error));
}

// Ajouter un écouteur d'événements pour la barre de recherche
document.getElementById('searchInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        const searchQuery = event.target.value;
        if (searchQuery) {
            geocodeLocation(searchQuery);
        }
    }
});

// Charger un fichier GeoJSON, GPX, ou KML
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            const extension = file.name.split('.').pop().toLowerCase();

            // Géolocaliser selon le type de fichier (GeoJSON, GPX, KML)
            if (extension === 'geojson') {
                const data = JSON.parse(content);
                L.geoJSON(data).addTo(map);
            } else if (extension === 'gpx' || extension === 'kml') {
                const parser = new DOMParser();
                const xml = parser.parseFromString(content, "text/xml");

                if (extension === 'gpx') {
                    const geojsonData = toGeoJSON.gpx(xml);
                    L.geoJSON(geojsonData).addTo(map);
                } else if (extension === 'kml') {
                    const geojsonData = toGeoJSON.kml(xml);
                    L.geoJSON(geojsonData).addTo(map);
                }
            }

            map.fitBounds(L.geoJSON(data).getBounds());
        };
        reader.readAsText(file);
    }
});

// Localiser la position actuelle
document.getElementById('locateBtn').addEventListener('click', function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
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

// Afficher l'itinéraire
document.getElementById('routeBtn').addEventListener('click', function() {
    if (currentMarker) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                const startLat = position.coords.latitude;
                const startLon = position.coords.longitude;
                const endLat = currentMarker.getLatLng().lat;
                const endLon = currentMarker.getLatLng().lng;

                // Si un itinéraire existe, on le supprime
                if (currentRoute) {
                    map.removeControl(currentRoute);
                }

                // Calculer et afficher l'itinéraire
                currentRoute = L.Routing.control({
                    waypoints: [
                        L.latLng(startLat, startLon),
                        L.latLng(endLat, endLon)
                    ],
                    createMarker: function() { return null; } // Ne pas afficher de marqueurs intermédiaires
                }).addTo(map);
            });
        } else {
            alert("La géolocalisation n'est pas supportée par votre navigateur.");
        }
    } else {
        alert("Veuillez d'abord effectuer une recherche de lieu.");
    }
});
