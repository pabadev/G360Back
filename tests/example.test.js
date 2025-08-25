import request from 'supertest'
import app from '../src/app.js'

describe('Example API Tests', () => {
  it('should return a 200 status for the root endpoint', async () => {
    const response = await request(app).get('/')
    expect(response.status).toBe(200)
  })

  it('should return a JSON response', async () => {
    const response = await request(app).get('/')
    expect(response.headers['content-type']).toEqual(expect.stringContaining('json'))
  })

  // Add more tests as needed
})
