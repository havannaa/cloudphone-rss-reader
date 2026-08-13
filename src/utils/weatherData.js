export const DISTRICTS = [
  { name: "Kushtia", lat: 23.9010, lon: 89.1205 },
  { name: "Dhaka", lat: 23.8103, lon: 90.4125 },
  { name: "Chittagong", lat: 22.3569, lon: 91.7832 },
  { name: "Khulna", lat: 22.8157, lon: 89.5510 },
  { name: "Rajshahi", lat: 24.3636, lon: 88.6241 },
  { name: "Barisal", lat: 22.7010, lon: 90.3535 },
  { name: "Sylhet", lat: 24.8949, lon: 91.8687 },
  { name: "Rangpur", lat: 25.7558, lon: 89.2447 },
  { name: "Mymensingh", lat: 24.7471, lon: 90.4203 },
  { name: "Comilla", lat: 23.4682, lon: 91.1788 },
  { name: "Jessore", lat: 23.1667, lon: 89.2167 }
];

export function getWeatherCondition(code) {
  const mapping = {
    0: { text: "Clear Sky", icon: "☀️" },
    1: { text: "Mainly Clear", icon: "🌤️" },
    2: { text: "Partly Cloudy", icon: "⛅" },
    3: { text: "Overcast", icon: "☁️" },
    45: { text: "Foggy", icon: "🌫️" },
    48: { text: "Depositing Rime Fog", icon: "🌫️" },
    51: { text: "Light Drizzle", icon: "🌧️" },
    53: { text: "Moderate Drizzle", icon: "🌧️" },
    55: { text: "Dense Drizzle", icon: "🌧️" },
    61: { text: "Light Rain", icon: "🌧️" },
    63: { text: "Moderate Rain", icon: "🌧️" },
    65: { text: "Heavy Rain", icon: "🌧️" },
    80: { text: "Light Rain Showers", icon: "🌦️" },
    81: { text: "Moderate Rain Showers", icon: "🌦️" },
    82: { text: "Heavy Rain Showers", icon: "🌦️" },
    95: { text: "Thunderstorm", icon: "⛈️" },
    96: { text: "Thunderstorm with Hail", icon: "⛈️" },
    99: { text: "Severe Thunderstorm", icon: "⛈️" }
  };
  return mapping[code] || { text: "Unknown", icon: "🌡️" };
}
