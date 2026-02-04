import { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null);

        // Kiểm tra mật khẩu nhập lại
        if (password !== passwordConfirmation) {
            setError("Mật khẩu nhập lại không khớp!");
            return;
        }

        try {
            // Gọi API Register bên Laravel
            const response = await axiosClient.post('/register', {
                name: name,
                email: email,
                password: password,
                password_confirmation: passwordConfirmation
            });

            console.log("Register OK:", response.data);
            
            // Đăng ký xong thì tự đăng nhập luôn (Lưu token)
            localStorage.setItem('ACCESS_TOKEN', response.data.token);
            localStorage.setItem('USER_INFO', JSON.stringify(response.data.user));

            alert("Đăng ký thành công!");
            navigate('/'); // Chuyển về trang chủ

        } catch (err) {
            console.error(err);
            // Lấy lỗi chi tiết từ Laravel (VD: Email đã tồn tại)
            if (err.response && err.response.data.errors) {
                const errorMessages = Object.values(err.response.data.errors).flat().join('\n');
                setError(errorMessages);
            } else {
                setError(err.response?.data?.message || "Đăng ký thất bại!");
            }
        }
    }

    return (
        <div style={{ maxWidth: 400, margin: '50px auto', padding: 20, border: '1px solid #ddd' }}>
            <h2>Đăng Ký Tài Khoản</h2>
            {error && <div style={{ color: 'red', whiteSpace: 'pre-line', marginBottom: 10 }}>{error}</div>}
            
            <form onSubmit={handleRegister}>
                <div style={{ marginBottom: 15 }}>
                    <label>Họ và Tên:</label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ width: '100%', padding: 8 }}
                        required
                    />
                </div>
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
                <div style={{ marginBottom: 15 }}>
                    <label>Nhập lại Mật khẩu:</label>
                    <input 
                        type="password" 
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        style={{ width: '100%', padding: 8 }}
                        required
                    />
                </div>
                <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer', marginRight: 10 }}>
                    Đăng Ký
                </button>
                <Link to="/login">Đã có tài khoản?</Link>
            </form>
        </div>
    )
}