import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import "./CategoriesPage.css";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    parent_id: "",
    image: "",
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axiosClient.get("/categories");
        setCategories(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    loadCategories();
  }, []);

  const fetchCategories = async () => {
    const res = await axiosClient.get("/categories");
    setCategories(res.data);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const data = {
        name: form.name,
        slug: form.slug || null,
        image: form.image || null,
        parent_id: form.parent_id ? Number(form.parent_id) : null,
      };

      if (editingId) {
        await axiosClient.put(`/categories/${editingId}`, data);
        setEditingId(null);
      } else {
        await axiosClient.post("/categories", data);
      }

      setForm({ name: "", slug: "", parent_id: "", image: "" });
      fetchCategories();
    } catch (error) {
      console.error(error.response?.data || error);
    }
  };

  const handleEdit = (cat) => {
    setForm({
      name: cat.name || "",
      slug: cat.slug || "",
      parent_id: cat.parent_id || "",
      image: cat.image || "",
    });
    setEditingId(cat.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa?")) return;
    await axiosClient.delete(`/categories/${id}`);
    fetchCategories();
  };

  return (
    <div className="page">
      <div className="container">
        <h2 className="title">Quản lý Category</h2>

        <div className="form">
          <input
            name="name"
            placeholder="Tên"
            value={form.name}
            onChange={handleChange}
          />
          <input
            name="slug"
            placeholder="Slug"
            value={form.slug}
            onChange={handleChange}
          />
          <input
            name="parent_id"
            placeholder="Parent ID"
            value={form.parent_id}
            onChange={handleChange}
          />
          <input
            name="image"
            placeholder="Image URL"
            value={form.image}
            onChange={handleChange}
          />

          <button onClick={handleSubmit} className="submit-btn">
            {editingId ? "Cập nhật" : "Thêm"}
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Slug</th>
                <th>Parent</th>
                <th>Image</th>
                <th>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.id}</td>
                  <td>{cat.name}</td>
                  <td>{cat.slug}</td>
                  <td>{cat.parent_id || "-"}</td>
                  <td>
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt=""
                        width="40"
                        height="40"
                        style={{ objectFit: "cover", borderRadius: "4px" }}
                      />
                    ) : (
                      "-"
                    )}
                  </td>

                  <td>
                    <div className="actions">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="btn-edit"
                      >
                        Sửa
                      </button>

                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="btn-delete"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {categories.length === 0 && (
            <p style={{ padding: "20px", textAlign: "center", color: "#999" }}>
              Không có dữ liệu
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
