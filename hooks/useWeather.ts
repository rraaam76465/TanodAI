import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

const API_KEY = '07be2da58c5af5c23314a35659b28f6e'; // Replace with your valid API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export function useWeather() {
  const [weather, setWeather] = useState({ emoji: '☀️', temperature: 25, condition: 'Sunny' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWeatherEmoji = (weatherId: number) => {
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
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Location permission not granted');
        }

        // Get the device's location
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

        const response = await fetch(
          `${BASE_URL}?lat=${location.coords.latitude}&lon=${location.coords.longitude}&units=metric&appid=${API_KEY}`
        );
        if (!response.ok) throw new Error('Failed to fetch weather data');
        const data = await response.json();
        
        setWeather({
          temperature: Math.round(data.main.temp),
          condition: data.weather[0].main,
          emoji: getWeatherEmoji(data.weather[0].id)
        });
      } catch (err) {
        console.error('Weather API Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  return { weather, loading, error };
} 