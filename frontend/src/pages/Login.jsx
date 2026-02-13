import { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        
        try {
            // Gọi API Login bên Laravel
            const response = await axiosClient.post('/login', {
                email: email,
                password: password
            });

            // Nếu thành công:
            console.log("Login OK:", response.data);
            
            // 1. Lưu token vào bộ nhớ trình duyệt
            localStorage.setItem('ACCESS_TOKEN', response.data.token);
            localStorage.setItem('USER_INFO', JSON.stringify(response.data.user));

            window.dispatchEvent(new Event("storage"));
            // 2. Thông báo & Chuyển trang
            alert("Đăng nhập thành công!");
            navigate('/'); // Chuyển về trang chủ
            

            
        } catch (err) {
            console.error(err);
            // Lấy thông báo lỗi từ Backend trả về
            setError(err.response?.data?.message || "Đăng nhập thất bại!");
        }
    }

    return (
        <div style={{ maxWidth: 400, margin: '50px auto', padding: 20, border: '1px solid #ddd' }}>
            <h2>Đăng Nhập Shopii</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 15 }}>
                    <label>Email:</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: '100%', padding: 8 }}
                        required
                    />
                </div>
                <div style={{ marginBottom: 15 }}>
                    <label>Mật khẩu:</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: 8 }}
                        required
                    />
                </div>
                <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>
                    Đăng Nhập
                </button>
            </form>
        </div>
    )
}