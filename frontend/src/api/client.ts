import axios from 'axios'

const client = axios.create({
    baseURL: '',
    headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

client.interceptors.response.use(
    (res) => {
        if (res.data && typeof res.data === 'object' && 'data' in res.data) {
            res.data = res.data.data
        }
        return res
    },
    (error) => {
        const backendMessage = error.response?.data?.error?.message
        if (backendMessage) {
            error.message = backendMessage
        }

        if (error.response?.status === 401) {
            if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                window.location.href = '/login'
            }
        }

        return Promise.reject(error)
    }
)

export default client
