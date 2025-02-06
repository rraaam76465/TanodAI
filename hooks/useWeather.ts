import { useState, useEffect } from 'react';

const API_KEY = '07be2da58c5af5c23314a35659b28f6e'; // Get from https://openweathermap.org/api
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export function useWeather() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getWeatherEmoji = (weatherId) => {
    if (weatherId >= 200 && weatherId < 300) return '⛈️'; // Thunderstorm
    if (weatherId >= 300 && weatherId < 400) return '🌧️'; // Drizzle
    if (weatherId >= 500 && weatherId < 600) return '🌧️'; // Rain
    if (weatherId >= 600 && weatherId < 700) return '❄️'; // Snow
    if (weatherId >= 700 && weatherId < 800) return '🌫️'; // Atmosphere
    if (weatherId === 800) return '☀️'; // Clear
    if (weatherId > 800) return '☁️'; // Clouds
    return '🌈'; // Default
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const response = await fetch(
          `${BASE_URL}?lat=${position.coords.latitude}&lon=${position.coords.longitude}&units=metric&appid=${API_KEY}`
        );
        const data = await response.json();
        
        setWeather({
          temperature: Math.round(data.main.temp),
          condition: data.weather[0].main,
          emoji: getWeatherEmoji(data.weather[0].id)
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  return { weather, loading, error };
} 