import { Component, OnInit } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { WeatherService } from '../services/weather/weather.service';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { SQLiteService } from '../services/sqlite/sqlite.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  currentLocation: { latitude: number; longitude: number } | null = null;
  weatherData: any;
  locationName: string | null = null;
  errorMessage: string | null = null;
  manualLocation: string | null = null;
  unit: string = 'metric';
  notificationsEnabled: boolean = false;
  darkModeEnabled: boolean = false;
  

  constructor(private weatherService: WeatherService, private sqliteService: SQLiteService) {}

  async ngOnInit() {
    await this.loadPreferences();
    this.getCurrentLocation();
  }

  async savePreference(key: string, value: string) {
    try {
      await Preferences.set({ key, value });
      console.log(`Preference [${key}] saved with value: ${value}`);
    } catch (error) {
      console.error(`Error saving preference [${key}]:`, error);
    }
  }

  async getPreference(key: string): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key });
      console.log(`Preference [${key}] retrieved with value: ${value}`);
      return value;
    } catch (error) {
      console.error(`Error retrieving preference [${key}]:`, error);
      return null;
    }
  }

  async loadPreferences() {
    const unit = await this.getPreference('unit');
    const notifications = await this.getPreference('notifications');
    const theme = await this.getPreference('theme');

    console.log('Loaded preferences:', { unit, notifications, theme });

   
    this.unit = unit ?? 'metric'; 
    this.notificationsEnabled = notifications === 'true';
    this.darkModeEnabled = theme === 'dark';

    if (this.darkModeEnabled) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }

  onUnitChange() {
    this.getWeather();
    this.savePreference('unit', this.unit);
  }

  onNotificationsToggle() {
    console.log(this.notificationsEnabled ? 'Notifications enabled' : 'Notifications disabled');
    this.savePreference('notifications', this.notificationsEnabled.toString());
  }

  async getCurrentLocation() {
    try {
      const position = await Geolocation.getCurrentPosition();
      this.currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      console.log('Current Location:', this.currentLocation);
      this.getWeather();
      this.getLocationName();
    } catch (error) {
      console.error('Error getting location:', error);
      this.errorMessage = 'Unable to retrieve location. Please check your device settings.';
    }
  }

  async getWeather() {
    const status = await Network.getStatus();
    if (!status.connected) {
      console.log('No network connection. Loading cached data...');
      await this.loadCachedWeatherData();
      return;
    }

    if (this.currentLocation) {
      this.weatherService
        .getWeatherData(this.currentLocation.latitude, this.currentLocation.longitude, this.unit)
        .subscribe(
          async (data) => {
            this.weatherData = data;
            console.log('Weather Data:', this.weatherData);

            const location = this.currentLocation 
              ? `${this.currentLocation.latitude},${this.currentLocation.longitude}` 
              : '';
            await this.sqliteService.saveWeatherData(location, JSON.stringify(data));
          },
          async (error) => {
            console.error('Error fetching weather data:', error);
            this.errorMessage = 'Unable to fetch weather data. Loading cached data...';

            await this.loadCachedWeatherData();
          }
        );
    }
  }

  getLocationName() {
    if (this.currentLocation) {
      this.weatherService
        .getLocationName(this.currentLocation.latitude, this.currentLocation.longitude)
        .subscribe(
          (data) => {
            if (data && data.length > 0) {
              this.locationName = data[0].name;
              console.log('Location Name:', this.locationName);
            } else {
              this.locationName = null;
              this.errorMessage = 'No location name found.';
              console.error('No location name found.');
            }
          },
          (error) => {
            console.error('Error fetching location name:', error);
            this.errorMessage = 'Unable to fetch location name. Please try again later.';
          }
        );
    }
  }

  fetchWeatherForManualLocation() {
    if (!this.manualLocation || this.manualLocation.trim() === '') {
      this.errorMessage = 'Please enter a valid city name.';
      console.error(this.errorMessage);
      return;
    }
  
    this.weatherService
      .getCoordinatesFromCity(this.manualLocation)
      .subscribe(
        (data) => {
          if (data && data.length > 0) {
            const { lat, lon, name } = data[0];
            this.currentLocation = { latitude: lat, longitude: lon };
            this.locationName = name;
            this.getWeather();
          } else {
            this.errorMessage = 'City not found. Please try again.';
          }
        },
        (error) => {
          console.error('Error fetching weather data for manual location:', error);
          this.errorMessage = 'Unable to fetch weather data for the specified location.';
        }
      );
  }

  goToCurrentLocation() {
    this.manualLocation = null; 
    this.errorMessage = null;
    this.getCurrentLocation();

  }

  getHour(timestamp: number):string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getDay(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString([], { weekday: 'long' });
  }

  getWeatherIcon(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  async onThemeToggle() {
    if (this.darkModeEnabled) {
      document.body.classList.add('dark');
      await this.savePreference('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      await this.savePreference('theme', 'light');
    }
  }

  async loadCachedWeatherData() {
    if (!this.currentLocation) {
      this.errorMessage = 'No location available to load cached weather data.';
      console.error(this.errorMessage);
      return;
    }

    const location = `${this.currentLocation.latitude},${this.currentLocation.longitude}`;
    const cachedData = await this.sqliteService.getWeatherData(location);

    if (cachedData) {
      this.weatherData = cachedData;
      console.log('Loaded cached weather data:', this.weatherData);
    } else {
      this.errorMessage = 'No cached weather data available.';
    }
  }
}