import { useState } from 'react'
import axiosClient from '../api/axiosClient'
import { useNavigate, Link } from 'react-router-dom'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setError(null)
    if (password !== passwordConfirmation) {
      setError('Mật khẩu nhập lại không khớp!')
      return
    }
    try {
      const response = await axiosClient.post('/register', {
        name: name,
        email: email,
        password: password,
        password_confirmation: passwordConfirmation,
      })

      console.log('Register OK:', response.data)
      localStorage.setItem('ACCESS_TOKEN', response.data.token)
      localStorage.setItem('USER_INFO', JSON.stringify(response.data.user))

      alert('Đăng ký thành công!')
      navigate('/')
    } catch (err) {
      console.error(err)
      if (err.response && err.response.data.errors) {
        const errorMessages = Object.values(err.response.data.errors)
          .flat()
          .join('\n')
        setError(errorMessages)
      } else {
        setError(err.response?.data?.message || 'Đăng ký thất bại!')
      }
    }
  }

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f4f6fb',
      }}
    >
      <div
        style={{
          width: '450px',
          background: '#ffffff',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            color: '#5a5df0',
            marginBottom: '10px',
            fontWeight: '600',
          }}
        >
          Đăng ký
        </h2>
        {error && (
          <div
            style={{
              background: '#ffe6e6',
              color: '#d8000c',
              padding: '10px',
              borderRadius: '6px',
              marginBottom: '15px',
              fontSize: '14px',
              whiteSpace: 'pre-line',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '22px', position: 'relative' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder=" "
              style={{
                width: '100%',
                padding: '14px 10px',
                borderRadius: '8px',
                border: '1.5px solid #ccc',
                outline: 'none',
                fontSize: '14px',
              }}
              onFocus={(e) => (e.target.style.border = '1.5px solid #5a5df0')}
              onBlur={(e) => (e.target.style.border = '1.5px solid #ccc')}
            />
            <label
              style={{
                position: 'absolute',
                left: '10px',
                top: email ? '-8px' : '50%',
                transform: email ? 'translateY(0)' : 'translateY(-50%)',
                background: '#fff',
                padding: '0 6px',
                fontSize: email ? '12px' : '14px',
                color: email ? '#5a5df0' : '#999',
                transition: '0.2s',
                pointerEvents: 'none',
              }}
            >
              Email / Số điện thoại
            </label>
          </div>

          <div style={{ marginBottom: '22px', position: 'relative' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder=" "
              style={{
                width: '100%',
                padding: '14px 10px',
                borderRadius: '8px',
                border: '1.5px solid #ccc',
                outline: 'none',
                fontSize: '14px',
              }}
              onFocus={(e) => (e.target.style.border = '1.5px solid #5a5df0')}
              onBlur={(e) => (e.target.style.border = '1.5px solid #ccc')}
            />
            <label
              style={{
                position: 'absolute',
                left: '10px',
                top: password ? '-8px' : '50%',
                transform: password ? 'translateY(0)' : 'translateY(-50%)',
                background: '#fff',
                padding: '0 6px',
                fontSize: password ? '12px' : '14px',
                color: password ? '#5a5df0' : '#999',
                transition: '0.2s',
                pointerEvents: 'none',
              }}
            >
              Mật khẩu
            </label>
          </div>

          <div style={{ marginBottom: '22px', position: 'relative' }}>
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              placeholder=" "
              style={{
                width: '100%',
                padding: '14px 10px',
                borderRadius: '8px',
                border: '1.5px solid #ccc',
                outline: 'none',
                fontSize: '14px',
              }}
              onFocus={(e) => (e.target.style.border = '1.5px solid #5a5df0')}
              onBlur={(e) => (e.target.style.border = '1.5px solid #ccc')}
            />
            <label
              style={{
                position: 'absolute',
                left: '10px',
                top: passwordConfirmation ? '-8px' : '50%',
                transform: passwordConfirmation
                  ? 'translateY(0)'
                  : 'translateY(-50%)',
                background: '#fff',
                padding: '0 6px',
                fontSize: passwordConfirmation ? '12px' : '14px',
                color: passwordConfirmation ? '#5a5df0' : '#999',
                transition: '0.2s',
                pointerEvents: 'none',
              }}
            >
              Nhập lại mật khẩu
            </label>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#5a5df0',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: '0.3s',
            }}
          >
            Đăng ký
          </button>

          <p
            style={{
              marginTop: '20px',
              fontSize: '14px',
              color: '#666',
            }}
          >
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              style={{
                color: '#5a5df0',
                textDecoration: 'none',
                fontWeight: '500',
              }}
            >
              Đăng nhập
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
