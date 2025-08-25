import axios from 'axios'

async function testSiigo() {
  try {
    // Hacemos login con las credenciales de prueba
    const response = await axios.post('https://api.siigo.com/auth', {
      username: 'siigoasi@pruebas.com',
      access_key: 'OWE1OGNKY2QtZGY4ZC00Nzg1LThIZGYtNmExMzUzMmE4Yzc1OjR1NyluZlIOE4='
    })

    console.log('✅ Autenticación exitosa!')
    console.log('Token recibido:', response.data.access_token)
  } catch (error) {
    console.error('❌ Error en autenticación:')
    console.error(error.response?.data || error.message)
  }
}

testSiigo()
