import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

const API_URL = environment.API_URL;
const API_KEY = environment.API_KEY;


@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  constructor(private http: HttpClient) {}

  getWeatherData(
    lat: number,
    lon: number,
    units: string = 'metric',
    exclude: string = ''
  ): Observable<any> {
    const url = `${API_URL}/onecall?lat=${lat}&lon=${lon}&exclude=${exclude}&appid=${API_KEY}&units=${units}`;
    console.log('Weather API URL:', url);
    return this.http.get<any>(url);
  }
 
  getLocationName(lat: number, lon: number): Observable<any> {
    const geocodingUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
    return this.http.get<any>(geocodingUrl);
  }

  getCoordinatesFromCity(city: string): Observable<any> {
    const geocodingUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`;
    return this.http.get<any>(geocodingUrl);
  }
}
