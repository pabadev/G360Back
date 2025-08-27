import axios from 'axios'

const BASE_URL = 'https://api.siigo.com/'

export async function getInvoices() {
  try {
    // obtener token
    const auth = await getSiigoToken()

    // aquí inventamos un endpoint de ejemplo (cuando tengas docs revisa el real)
    const url = 'https://api.siigo.com/v1/invoices'

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${auth.access_token}`
      }
    })

    return response.data // debería traer { sales: [...] }
  } catch (error) {
    console.error('❌ Error en getInvoices:', error.message)
    throw error
  }
}
