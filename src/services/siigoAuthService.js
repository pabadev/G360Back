// src/services/siigoAuthService.js
import axios from 'axios'

const SIIGO_AUTH_URL = 'https://private-anon-9e989f2776-siigoapi.apiary-mock.com/auth' // endpoint sandbox

export async function getSiigoToken() {
  try {
    const response = await axios.post(
      SIIGO_AUTH_URL,
      {
        username: 'sandbox@siigoapi.com',
        access_key: 'NDllMzI0NmEtNjExZC00NGM3LWE3OTQtMWUyNTNlZWU0ZTM0OkosU2MwLD4xQ08=' // tu access key del sandbox
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Partner-Id': 'Gestion360' // nombre de tu app
        }
      }
    )

    // la API devuelve algo como { access_token: "...", expires_in: ... }

    console.log(response.data)
    return response.data
  } catch (error) {
    console.error('Error autenticando en Siigo:', error.message)
    throw new Error('No se pudo autenticar en Siigo')
  }
}
