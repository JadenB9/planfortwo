import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.stubGlobal('fetch', vi.fn())

import { weatherService } from './weather.js'

const mockedFetch = vi.mocked(fetch)

function createMockWeatherResponse(days: number) {
  const time: string[] = []
  const temperatureMax: number[] = []
  const temperatureMin: number[] = []
  const precipitationSum: number[] = []
  const weatherCode: number[] = []

  for (let i = 0; i < days; i++) {
    const date = new Date(2026, 5, 15 + i)
    time.push(date.toISOString().split('T')[0])
    temperatureMax.push(28 + i)
    temperatureMin.push(18 + i)
    precipitationSum.push(i * 0.5)
    weatherCode.push(i === 0 ? 0 : 3)
  }

  return {
    daily: {
      time,
      temperature_2m_max: temperatureMax,
      temperature_2m_min: temperatureMin,
      precipitation_sum: precipitationSum,
      weather_code: weatherCode,
    },
  }
}

describe('Weather Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getForecast', () => {
    it('should return mapped forecast data', async () => {
      const mockData = createMockWeatherResponse(3)

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      } as unknown as Response)

      const result = await weatherService.getForecast(39.7456, -84.1862, 3)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        date: mockData.daily.time[0],
        temperatureMax: 28,
        temperatureMin: 18,
        precipitation: 0,
        weatherCode: 0,
        description: 'Clear sky',
      })
      expect(result[1]).toEqual({
        date: mockData.daily.time[1],
        temperatureMax: 29,
        temperatureMin: 19,
        precipitation: 0.5,
        weatherCode: 3,
        description: 'Overcast',
      })
    })

    it('should default to 7 days when no days parameter is provided', async () => {
      const mockData = createMockWeatherResponse(7)

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      } as unknown as Response)

      const result = await weatherService.getForecast(39.7456, -84.1862)

      expect(result).toHaveLength(7)
      expect(mockedFetch).toHaveBeenCalledWith(expect.stringContaining('forecast_days=7'))
    })

    it('should cap forecast at 16 days', async () => {
      const mockData = createMockWeatherResponse(16)

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      } as unknown as Response)

      await weatherService.getForecast(39.7456, -84.1862, 30)

      expect(mockedFetch).toHaveBeenCalledWith(expect.stringContaining('forecast_days=16'))
    })

    it('should throw on API error', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as unknown as Response)

      await expect(weatherService.getForecast(39.7456, -84.1862)).rejects.toThrow(
        'Weather API error: 500',
      )
    })

    it('should include correct query parameters in the URL', async () => {
      const mockData = createMockWeatherResponse(5)

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      } as unknown as Response)

      await weatherService.getForecast(40.0, -83.0, 5)

      const calledUrl = mockedFetch.mock.calls[0]![0] as string
      expect(calledUrl).toContain('latitude=40')
      expect(calledUrl).toContain('longitude=-83')
      expect(calledUrl).toContain('forecast_days=5')
      expect(calledUrl).toContain('temperature_2m_max')
      expect(calledUrl).toContain('precipitation_sum')
      expect(calledUrl).toContain('weather_code')
    })
  })
})
