import logger from '../utils/logger.js'
import axios from 'axios'

export const getPosts = async (req, res, next) => {
  try {
    const url = 'https://jsonplaceholder.typicode.com/posts'
    const { data } = await axios.get(url)

    // Mostrar en consola (solo primeros 5)
    logger.info('jsonplaceholder posts (first 5): %o', data.slice(0, 5))

    return res.json({ success: true, count: data.length, data })
  } catch (err) {
    return next(err)
  }
}

export default { getPosts }
