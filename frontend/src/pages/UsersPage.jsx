import React, { useEffect, useState } from "react";

const API = "https://shopii-backend-latest.onrender.com";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // LOAD USERS FROM HTML
  const loadUsers = async () => {
    const res = await fetch(API + "/users");
    const html = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const rows = doc.querySelectorAll("table tr");

    const list = [];

    for (let i = 1; i < rows.length; i++) {
      const tds = rows[i].querySelectorAll("td");

      const id = tds[0]?.innerText.trim();

      const name = tds[1]?.querySelector("input")?.value;

      const email = tds[2]?.querySelector("input")?.value;

      if (id) {
        list.push({ id, name, email });
      }
    }

    setUsers(list);
  };
  useEffect(() => {
    loadUsers();
  }, []);

  // CREATE
  const createUser = async () => {
    await fetch(API + "/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `name=${name}&email=${email}`,
    });

    setName("");
    setEmail("");

    loadUsers();
  };

  // UPDATE
  const updateUser = async (id) => {
    const name = document.getElementById("name" + id).value;
    const email = document.getElementById("email" + id).value;

    await fetch(API + `/users/${id}/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `name=${name}&email=${email}`,
    });

    loadUsers();
  };

  // DELETE
  const deleteUser = async (id) => {
    await fetch(API + `/users/${id}/delete`, {
      method: "POST",
    });

    loadUsers();
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Users CRUD</h1>

      {/* CREATE */}

      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={createUser}>Create</button>

      <br />
      <br />

      {/* TABLE */}

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>

              <td>
                <input defaultValue={u.name} id={"name" + u.id} />
              </td>

              <td>
                <input defaultValue={u.email} id={"email" + u.id} />
              </td>

              <td>
                <button onClick={() => updateUser(u.id)}>Update</button>

                <button onClick={() => deleteUser(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UsersPage;
