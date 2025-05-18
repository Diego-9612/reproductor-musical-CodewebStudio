import songs from './data.js';

// Selección de elementos del DOM
const menuBtn = document.querySelector(".menu-btn");
const container = document.querySelector(".container-principal");
const playListContainer = document.querySelector("#playlist");
const infoWrapper = document.querySelector(".info-song");
const coverImage = document.querySelector(".cover-image");
const currentSongTitle = document.querySelector(".actual-song-title");
const currentFavourite = document.querySelector("#current-favourite");
const playPauseBtn = document.querySelector("#playpause");
const nextBtn = document.querySelector("#next");
const prevBtn = document.querySelector("#prev");
const shuffleBtn = document.querySelector("#shuffle");
const repeatBtn = document.querySelector("#repeat");
const progressBar = document.querySelector(".bar");
const progressDot = document.querySelector(".dot");
const currentTimeEl = document.querySelector(".current-time");
const durationEl = document.querySelector(".duration");
const volumeBtn = document.querySelector('#volume-btn');
const volumeSlider = document.querySelector('#volume-slider');

// Variables de estado
let playing = false;
let currentSong = 0;
let shuffle = false;
let repeat = false;
let favourits = JSON.parse(localStorage.getItem('favourites')) || [];
let audio = new Audio();
audio.volume = volumeSlider ? parseFloat(volumeSlider.value) : 1;

// Inicialización del reproductor
function init() {
    loadSavedVolume();
    updatePlayList(songs);
    loadSong(currentSong).catch(console.error);
    updateFavouriteIcon();
}

// Cargar volumen guardado
function loadSavedVolume() {
    const savedVolume = localStorage.getItem('playerVolume');
    if (savedVolume) {
        audio.volume = parseFloat(savedVolume);
        if (volumeSlider) {
            volumeSlider.value = savedVolume;
            updateVolumeIcon(audio.volume);
        }
    }
}

// Control de volumen
if (volumeSlider && volumeBtn) {
    volumeSlider.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value);
        audio.volume = volume;
        localStorage.setItem('playerVolume', volume);
        updateVolumeIcon(volume);
    });

    volumeBtn.addEventListener('click', () => {
        if (audio.volume > 0) {
            volumeSlider.dataset.lastVolume = audio.volume;
            audio.volume = 0;
            volumeSlider.value = 0;
        } else {
            const lastVolume = parseFloat(volumeSlider.dataset.lastVolume) || 0.7;
            audio.volume = lastVolume;
            volumeSlider.value = lastVolume;
        }
        updateVolumeIcon(audio.volume);
    });
}

function updateVolumeIcon(volume) {
    if (!volumeBtn) return;
    
    if (volume == 0) {
        volumeBtn.className = 'fas fa-volume-mute';
    } else if (volume < 0.5) {
        volumeBtn.className = 'fas fa-volume-down';
    } else {
        volumeBtn.className = 'fas fa-volume-up';
    }
}

// Menú principal
menuBtn.addEventListener("click", () => {
    container.classList.toggle("active");
});

// Actualizar lista de reproducción
function updatePlayList(songs) {
    if (!playListContainer) return;

    playListContainer.innerHTML = "";

    songs.forEach((song, index) => {
        const { title, src } = song;
        const isFavourite = favourits.includes(index);

        const tr = document.createElement("tr");
        tr.classList.add("song");
        tr.innerHTML = ` 
        <td class="no">
            <h5>${index + 1}</h5>
        </td>
        <td class="title">
            <h6>${title}</h6>
        </td>
        <td class="length">
            <h6>2:03</h6> 
        </td>
        <td>
            <i class="fas fa-heart ${isFavourite ? "active" : ""}"></i>
        </td>
        `;
        playListContainer.appendChild(tr);

        // Evento para hacer clic en la fila
        tr.addEventListener("click", async (e) => {
            if (e.target.classList.contains("fa-heart")) {
                addToFavourits(index);
                e.target.classList.toggle("active");
                return;
            }
            
            currentSong = index;
            await loadSong(currentSong);
            container.classList.remove("active");
            playPauseBtn.classList.replace("fa-play", "fa-pause");
            playing = true;
        });

        // Cargar duración de la canción
        const audioForDuration = new Audio(src);
        audioForDuration.addEventListener("loadedmetadata", () => {
            const duration = audioForDuration.duration;
            let songDuration = formatTime(duration);
            const lengthElement = tr.querySelector(".length h5");
            if (lengthElement) {
                lengthElement.innerText = songDuration;
            }
        });
    });
}

// Formatear tiempo
function formatTime(time) {
    let minutes = Math.floor(time / 60);
    let seconds = Math.floor(time % 60);
    seconds = seconds < 10 ? `0${seconds}` : seconds;
    return `${minutes}:${seconds}`;
}

// Cargar canción
async function loadSong(num) {
    if (!songs[num]) return;

    // Actualizar información de la canción
    infoWrapper.innerHTML = `
        <h2>${songs[num].title}</h2>
        <h3>${songs[num].artist}</h3>
    `;

    currentSongTitle.innerHTML = songs[num].title;
    coverImage.style.backgroundImage = `url(${songs[num].img_src})`;

    // Cambiar fuente de audio
    audio.pause();
    audio.src = songs[num].src;
    
    try {
        await audio.load();
        if (playing) {
            await audio.play();
        }
    } catch (error) {
        console.error("Error al cargar canción:", error);
    }

    // Actualizar icono de favoritos
    updateFavouriteIcon();
}

// Control de reproducción
playPauseBtn.addEventListener("click", async () => {
    try {
        if (playing) {
            await audio.pause();
            playPauseBtn.classList.replace("fa-pause", "fa-play");
        } else {
            await audio.play();
            playPauseBtn.classList.replace("fa-play", "fa-pause");
        }
        playing = !playing;
    } catch (error) {
        console.error("Error al reproducir:", error);
    }
});

// Canción siguiente
async function nextSong() {
    if (shuffle) {
        shuffleSongs();
    } else {
        currentSong = (currentSong + 1) % songs.length;
    }
    
    await loadSong(currentSong);
    
    if (playing) {
        try {
            await audio.play();
        } catch (error) {
            console.error("Error al reproducir:", error);
        }
    }
}

nextBtn.addEventListener("click", nextSong);

// Canción anterior
async function prevSong() {
    if (shuffle) {
        shuffleSongs();
    } else {
        currentSong = (currentSong - 1 + songs.length) % songs.length;
    }
    
    await loadSong(currentSong);
    
    if (playing) {
        try {
            await audio.play();
        } catch (error) {
            console.error("Error al reproducir:", error);
        }
    }
}

prevBtn.addEventListener("click", prevSong);

// Favoritos
function addToFavourits(index) {
    if (favourits.includes(index)) {
        favourits = favourits.filter((item) => item !== index);
    } else {
        favourits.push(index);
    }
    localStorage.setItem('favourites', JSON.stringify(favourits));
    
    if (index === currentSong) {
        updateFavouriteIcon();
    }
    updatePlayList(songs);
}

function updateFavouriteIcon() {
    if (favourits.includes(currentSong)) {
        currentFavourite.classList.add("active");
    } else {
        currentFavourite.classList.remove("active");
    }
}

currentFavourite.addEventListener("click", () => {
    addToFavourits(currentSong);
});

// Modo shuffle
function shuffleSongs() {
    shuffle = !shuffle;
    shuffleBtn.classList.toggle("active");
    
    if (shuffle) {
        currentSong = Math.floor(Math.random() * songs.length);
    }
}

shuffleBtn.addEventListener("click", shuffleSongs);

// Modo repetición
function repeatSong() {
    if (repeat === 0) {
        repeat = 1;
        repeatBtn.classList.add("active");
    } else if (repeat === 1) {
        repeat = 2;
        repeatBtn.classList.add("active");
    } else {
        repeat = 0;
        repeatBtn.classList.remove("active");
    }
}

repeatBtn.addEventListener("click", repeatSong);

// Barra de progreso
function progress() {
    if (!audio.duration || isNaN(audio.duration)) return;

    currentTimeEl.textContent = formatTime(audio.currentTime);
    durationEl.textContent = formatTime(audio.duration);

    const progressPercentage = (audio.currentTime / audio.duration) * 100;
    progressDot.style.left = `${progressPercentage}%`;
}

audio.addEventListener("timeupdate", progress);

function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
}

if (progressBar) {
    progressBar.addEventListener("click", setProgress);
}

// Cuando termina la canción
audio.addEventListener("ended", () => {
    if (repeat === 1) {
        audio.currentTime = 0;
        audio.play();
    } else if (repeat === 2) {
        nextSong();
    } else {
        if (currentSong === songs.length - 1) {
            audio.pause();
            playPauseBtn.classList.replace("fa-pause", "fa-play");
            playing = false;
        } else {
            nextSong();
        }
    }
});

// Inicializar el reproductor
init();