// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const centerInput = document.getElementById('center');
    const widthSlider = document.getElementById('width');
    const widthValueSpan = document.getElementById('widthValue');
    const heightSlider = document.getElementById('height');
    const heightValueSpan = document.getElementById('heightValue');
    const scaleSlider = document.getElementById('scale');
    const scaleValueSpan = document.getElementById('scaleValue');
    const geocodingApiKeyInput = document.getElementById('geocodingApiKey');
    const staticMapApiKeyInput = document.getElementById('staticMapApiKey');
    const zoomSlider = document.getElementById('zoom');
    const zoomValueSpan = document.getElementById('zoomValue');
    const generateMapButton = document.getElementById('generateMap');
    const mapImage = document.getElementById('mapImage');
    const downloadMapButton = document.getElementById('downloadMap');

    // Update slider value displays
    widthSlider.addEventListener('input', () => widthValueSpan.textContent = widthSlider.value);
    heightSlider.addEventListener('input', () => heightValueSpan.textContent = heightSlider.value);
    scaleSlider.addEventListener('input', () => scaleValueSpan.textContent = scaleSlider.value);
    zoomSlider.addEventListener('input', () => zoomValueSpan.textContent = zoomSlider.value);

    // Generate Map button event listener
    generateMapButton.addEventListener('click', async () => {
        const centerKeyword = centerInput.value;
        const width = widthSlider.value;
        const height = heightSlider.value;
        const scale = scaleSlider.value;
        const geocodingApiKey = geocodingApiKeyInput.value;
        const staticMapApiKey = staticMapApiKeyInput.value;
        const zoomLevel = zoomSlider.value;

        if (!centerKeyword) {
            alert('Please enter a center point.');
            return;
        }

        if (!geocodingApiKey || !staticMapApiKey) {
            alert('Please enter both Geocoding and Static Map API keys in the input fields.');
            mapImage.alt = 'API Key not provided. Please enter API keys in the input fields.';
            mapImage.src = ''; // Clear previous image
            downloadMapButton.style.display = 'none';
            return;
        }

        mapImage.alt = 'Loading map...';
        mapImage.src = ''; // Clear previous image
        downloadMapButton.style.display = 'none';


        try {
            // 1. Geocode the center point
            const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(centerKeyword)}&key=${geocodingApiKey}`;
            const geoResponse = await fetch(geocodingUrl);
            const geoData = await geoResponse.json();

            if (geoData.status !== 'OK' || !geoData.results || geoData.results.length === 0) {
                throw new Error('Geocoding failed or no results found. Status: ' + geoData.status + (geoData.error_message ? ' - ' + geoData.error_message : ''));
            }

            const location = geoData.results[0].geometry.location; // lat, lng

            // 2. Construct Static Map API URL
            const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=${zoomLevel}&size=${width}x${height}&scale=${scale}&maptype=roadmap&key=${staticMapApiKey}`;

            // 3. Display the map
            mapImage.src = staticMapUrl;
            mapImage.alt = `Map of ${centerKeyword}`;
            document.querySelector('.map-container').style.display = 'block'; // Show map container
            downloadMapButton.style.display = 'block'; // Show download button

        } catch (error) {
            console.error('Error generating map:', error);
            alert(`Error generating map: ${error.message}`);
            mapImage.alt = `Error generating map: ${error.message}`;
            mapImage.src = '';
            document.querySelector('.map-container').style.display = 'none'; // Hide map container on error
            downloadMapButton.style.display = 'none';
        }
    });

    // Download Map button event listener
    downloadMapButton.addEventListener('click', () => {
        if (!mapImage.src || mapImage.src.startsWith('data:')) { // Don't download if no src or if it's already a data URI from previous failed attempts
             alert('No map image to download or image source is invalid.');
             return;
        }

        // To bypass CORS issues with canvas.toDataURL for external images,
        // we fetch the image again, convert it to a blob, then create a data URL.
        fetch(mapImage.src)
            .then(response => response.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const dataUrl = reader.result;
                    const a = document.createElement('a');
                    a.href = dataUrl;
                    a.download = `map_${centerInput.value.replace(/\s+/g, '_') || 'custom'}.png`; // Set a dynamic filename
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                };
                reader.readAsDataURL(blob);
            })
            .catch(error => {
                console.error('Error preparing image for download:', error);
                alert('Could not download the map image. See console for details.');
            });
    });
});
