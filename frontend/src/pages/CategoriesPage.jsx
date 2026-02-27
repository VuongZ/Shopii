import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await axiosClient.get("/categories");
            setCategories(res.data);
        } catch (error) {
            console.error("Lỗi lấy categories:", error);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Danh sách Categories (Admin)</h2>
            <ul>
                {categories.map((cat) => (
                    <li key={cat.id}>
                        {cat.name}
                    </li>
                ))}
            </ul>
        </div>
    );
}