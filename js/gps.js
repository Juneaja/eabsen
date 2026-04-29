async function getGPS() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject('Geolocation tidak didukung');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            position => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            error => {
                reject('Gagal mendapatkan lokasi: ' + error.message);
            },
            { 
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000 
            }
        );
    });
}
