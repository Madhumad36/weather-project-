/* =======================
   ELEMENT REFERENCES
======================= */
const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const locateBtn = document.getElementById("locateBtn");
const unitToggle = document.getElementById("unitToggle");

const cityLabel = document.getElementById("cityLabel");
const tempLabel = document.getElementById("tempLabel");
const descLabel = document.getElementById("descLabel");
const weatherMood = document.getElementById("weatherMood");

const weatherIcon = document.querySelector(".weather-icon");
const weatherEffectEl = document.getElementById("weatherEffect");
const weatherAura = document.getElementById("weatherAura");

const feelsLikeEl = document.getElementById("feelsLike");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");

const forecastCards = document.querySelectorAll(".forecast-card");

const loadingEl = document.getElementById("loading");
const alertBanner = document.getElementById("alertBanner");

const API_KEY = "da5cc509bc967933cf9f957a7a06eb9b";

/* =======================
   STATE & SETTINGS
======================= */
let isCelsius = true;
let lastTempC = null;
let lastFeelsC = null;

/* ---------- STATE → CAPITAL MAP ---------- */
const stateToCity = {
    "andhra pradesh": "amaravati",
    "telangana": "hyderabad",
    "tamil nadu": "chennai",
    "karnataka": "bengaluru",
    "kerala": "thiruvananthapuram",
    "maharashtra": "mumbai",
    "gujarat": "gandhinagar",
    "rajasthan": "jaipur",
    "uttar pradesh": "lucknow",
    "madhya pradesh": "bhopal",
    "west bengal": "kolkata",
    "bihar": "patna",
    "odisha": "bhubaneswar",
    "assam": "guwahati",
    "punjab": "chandigarh",
    "haryana": "chandigarh",
    "jharkhand": "ranchi",
    "chhattisgarh": "raipur",
    "uttarakhand": "dehradun",
    "himachal pradesh": "shimla",
    "jammu and kashmir": "srinagar",
    "goa": "panaji"
};

/* =======================
   EVENT LISTENERS
======================= */
searchBtn.addEventListener("click", () => fetchWeather());
cityInput.addEventListener("keydown", e => {
    if (e.key === "Enter") fetchWeather();
});

unitToggle.addEventListener("click", toggleUnit);
locateBtn.addEventListener("click", getLocationWeather);

/* =======================
   MAIN FETCH FUNCTION
======================= */
async function fetchWeather(cityOverride = null) {
    let city = cityOverride || cityInput.value.trim().toLowerCase();
    if (!city) return alert("Enter a city or Indian state name");

    city = stateToCity[city] || city;
    localStorage.setItem("lastCity", city);

    showLoading(true);
    showAlert("");

    try {
        const currentURL =
            `https://api.openweathermap.org/data/2.5/weather?q=${city},IN&units=metric&appid=${API_KEY}`;

        const forecastURL =
            `https://api.openweathermap.org/data/2.5/forecast?q=${city},IN&units=metric&appid=${API_KEY}`;

        const currentRes = await fetch(currentURL);
        const currentData = await currentRes.json();

        if (Number(currentData.cod) !== 200) {
            showLoading(false);
            return showAlert("Location not found ❌");
        }

        /* ----- CURRENT WEATHER ----- */
        cityLabel.textContent = currentData.name;
        descLabel.textContent = currentData.weather[0].description;

        lastTempC = currentData.main.temp;
        lastFeelsC = currentData.main.feels_like;

        renderTemperature();

        feelsLikeEl.textContent = `Feels like: ${Math.round(lastFeelsC)} °C`;
        humidityEl.textContent = `Humidity: ${currentData.main.humidity}%`;
        windEl.textContent = `Wind: ${Math.round(currentData.wind.speed * 3.6)} km/h`;

        applyWeatherEffect(currentData.weather[0].main);
        updateBackground(currentData.weather[0].main);
        applyMood(currentData.weather[0].main);
        applyAlert(currentData);
        updateAura(currentData.weather[0].main);   // 🌟 AURA ADDED HERE

        weatherIcon.querySelector("img")?.remove();
        const icon = document.createElement("img");
        icon.src = `https://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png`;
        icon.alt = "Current weather icon";
        weatherIcon.appendChild(icon);

        /* ----- FORECAST ----- */
        const forecastRes = await fetch(forecastURL);
        const forecastData = await forecastRes.json();

        forecastCards.forEach((card, i) => {
            const data = forecastData.list[i * 8];
            if (!data) return;

            card.querySelector(".day-name").textContent =
                new Date(data.dt_txt).toLocaleDateString("en-US", { weekday: "short" });

            card.querySelector(".icon").innerHTML =
                `<img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png"
                      alt="Forecast weather icon">`;

            card.querySelector(".day-temp").textContent =
                `${Math.round(data.main.temp)} °C`;
        });

    } catch (err) {
        showAlert("Network error. Please try again.");
        console.error(err);
    } finally {
        showLoading(false);
    }
}

/* =======================
   UTILITIES
======================= */
function showLoading(show) {
    loadingEl.classList.toggle("hidden", !show);
}

function showAlert(msg) {
    alertBanner.textContent = msg;
    alertBanner.classList.toggle("hidden", !msg);
}

/* ---------- UNIT TOGGLE ---------- */
function toggleUnit() {
    if (lastTempC === null) return;

    isCelsius = !isCelsius;
    unitToggle.classList.toggle("unit-active", !isCelsius);
    renderTemperature();
}

function renderTemperature() {
    if (isCelsius) {
        tempLabel.textContent = `${Math.round(lastTempC)} °C`;
        feelsLikeEl.textContent = `Feels like: ${Math.round(lastFeelsC)} °C`;
    } else {
        tempLabel.textContent = `${Math.round(lastTempC * 9/5 + 32)} °F`;
        feelsLikeEl.textContent =
            `Feels like: ${Math.round(lastFeelsC * 9/5 + 32)} °F`;
    }
}

/* ---------- LOCATION ---------- */
function getLocationWeather() {
    if (!navigator.geolocation) return showAlert("Geolocation not supported");

    navigator.geolocation.getCurrentPosition(pos => {
        fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
    }, () => showAlert("Location permission denied"));
}

async function fetchWeatherByCoords(lat, lon) {
    showLoading(true);
    showAlert("");

    const url =
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    cityInput.value = data.name;
    fetchWeather(data.name);
}

/* ---------- BACKGROUND ---------- */
function updateBackground(condition) {
    document.body.className = "default-bg";

    const map = {
        clear: "sunny",
        clouds: "cloudy",
        rain: "rainy",
        drizzle: "rainy",
        thunderstorm: "thunderstorm",
        snow: "snowy",
        mist: "misty",
        fog: "misty",
        haze: "misty"
    };

    document.body.classList.add(map[condition.toLowerCase()] || "");
}

/* ---------- EFFECT ICON ---------- */
function applyWeatherEffect(condition) {
    const effects = {
        clear: "☀️",
        clouds: "☁️",
        rain: "🌧️",
        drizzle: "🌧️",
        thunderstorm: "⛈️",
        mist: "🌫️",
        fog: "🌫️",
        haze: "🌫️",
        snow: "❄️"
    };
    weatherEffectEl.textContent = effects[condition.toLowerCase()] || "";
}

/* ---------- MOOD TEXT ---------- */
function applyMood(condition) {
    const moods = {
        clear: "Perfect day to conquer goals ☀️",
        clouds: "A calm sky for a calm mind ☁️",
        rain: "Rainy days and blurry windows-peace 🌧️",
        thunderstorm: "Nature is growling today ⛈️",
        mist: "Slow down. Breathe. 🌫️",
        snow: "Quiet, calm, and beautiful ❄️"
    };
    weatherMood.textContent = moods[condition.toLowerCase()] || "";
}

/* ---------- ALERTS ---------- */
function applyAlert(data) {
    if (data.main.temp > 40) {
        showAlert("🔥 Heat Alert: Stay hydrated!");
    } else if (data.weather[0].main.toLowerCase() === "rain") {
        showAlert("🌧️ Rain Alert: Drive carefully");
    }
}

/* ---------- AURA OVERLAY (FINAL BOSS) ---------- */
function updateAura(condition) {
    weatherAura.className = "";
    const auraMap = {
        clear: "aura-sunny",
        clouds: "aura-misty",
        rain: "aura-rainy",
        drizzle: "aura-rainy",
        mist: "aura-misty",
        fog: "aura-misty",
        haze: "aura-misty",
        snow: "aura-snowy"
    };
    weatherAura.classList.add(auraMap[condition.toLowerCase()] || "");
}

/* =======================
   LOAD LAST CITY
======================= */
const lastCity = localStorage.getItem("lastCity");
if (lastCity) {
    cityInput.value = lastCity;
    fetchWeather(lastCity);
}
