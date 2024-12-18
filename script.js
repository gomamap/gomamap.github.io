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

// Variables globales pour gérer le marqueur et l'itinéraire
let currentMarker = null;
let currentRoute = null;
let geoJsonData = []; // Variable pour stocker les données GeoJSON

// Charger un fichier GeoJSON
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            const extension = file.name.split('.').pop().toLowerCase();

            // Géolocaliser selon le type de fichier (GeoJSON)
            if (extension === 'geojson') {
                geoJsonData = JSON.parse(content);
                L.geoJSON(geoJsonData).addTo(map);
            }

            map.fitBounds(L.geoJSON(geoJsonData).getBounds());
        };
        reader.readAsText(file);
    }
});

// Fonction de recherche dans le GeoJSON (uniquement pour Goma)
function searchHouse(query) {
    const result = geoJsonData.features.find(feature => {
        // Recherche par numéro de maison et adresse
        const houseNumber = feature.properties.num_mais.toLowerCase();
        const address = feature.properties.adresse.toLowerCase();
        const city = feature.properties.ville.toLowerCase();
        return (houseNumber.includes(query.toLowerCase()) || address.includes(query.toLowerCase())) && city === 'goma';
    });

    if (result) {
        const lat = result.geometry.coordinates[1];
        const lon = result.geometry.coordinates[0];
        const houseName = result.properties.num_mais;
        const fullAddress = result.properties.adresse;  // Adresse complète
        const city = result.properties.ville;           // Ville
        const otherInfo = result.properties.otherInfo || "Aucune information supplémentaire"; // Autres informations

        // Centrer la carte sur la maison trouvée
        map.setView([lat, lon], 13);

        // Effacer l'ancien marqueur si présent
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }

        // Ajouter un nouveau marqueur pour la maison
        currentMarker = L.marker([lat, lon]).addTo(map)
            .bindPopup(`
                <strong>Maison: ${houseName}</strong><br>
                <strong>Adresse:</strong> ${fullAddress}<br>
                <strong>Ville:</strong> ${city}<br>
                <strong>Informations supplémentaires:</strong> ${otherInfo}
            `)
            .openPopup();
    } else {
        alert("Maison non trouvée à Goma.");
    }
}

// Ajouter un écouteur d'événements pour la barre de recherche
document.getElementById('searchInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        const searchQuery = event.target.value;
        if (searchQuery) {
            searchHouse(searchQuery);
        }
    }
});

// Fonction de géocodage via Nominatim (OpenStreetMap) limitée à Goma
function geocodeLocation(location) {
    // Limiter la recherche à Goma uniquement en ajoutant "+Goma" à la requête
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}+Goma&format=json&addressdetails=1`;

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
                alert("Lieu introuvable à Goma.");
            }
        })
        .catch(error => console.error("Erreur lors du géocodage : ", error));
}
