export interface WeatherForecast {
  date: string
  temperatureMax: number
  temperatureMin: number
  precipitation: number
  weatherCode: number
  description: string
}

const WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
}

export const weatherService = {
  async getForecast(
    latitude: number,
    longitude: number,
    days: number = 7,
  ): Promise<WeatherForecast[]> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=auto&forecast_days=${Math.min(days, 16)}`

    const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`)
    }

    const data = (await response.json()) as {
      daily: {
        time: string[]
        temperature_2m_max: number[]
        temperature_2m_min: number[]
        precipitation_sum: number[]
        weather_code: number[]
      }
    }

    return data.daily.time.map((date, i) => {
      const code = data.daily.weather_code[i] ?? 0
      return {
        date,
        temperatureMax: data.daily.temperature_2m_max[i] ?? 0,
        temperatureMin: data.daily.temperature_2m_min[i] ?? 0,
        precipitation: data.daily.precipitation_sum[i] ?? 0,
        weatherCode: code,
        description: WEATHER_CODES[code] ?? 'Unknown',
      }
    })
  },
}
