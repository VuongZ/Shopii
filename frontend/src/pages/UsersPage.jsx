import React, { useEffect, useState } from "react";

const API = "https://shopii-backend-latest.onrender.com";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const loadUsers = () => {
    fetch(API + "/users")
      .then((res) => res.text())
      .then((html) => {
        let parser = new DOMParser();
        let doc = parser.parseFromString(html, "text/html");

        let rows = doc.querySelectorAll("table tr");

        let list = [];

        for (let i = 1; i < rows.length; i++) {
          let cells = rows[i].querySelectorAll("td");

          list.push({
            id: cells[0].innerText,
            name: cells[1].innerText,
            email: cells[2].innerText,
          });
        }

        setUsers(list);
      });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // CREATE
  const createUser = () => {
    fetch(API + "/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `name=${name}&email=${email}`,
    }).then(() => {
      setName("");
      setEmail("");
      loadUsers();
    });
  };

  // UPDATE
  const updateUser = (id) => {
    let name = document.getElementById("name" + id).value;
    let email = document.getElementById("email" + id).value;

    fetch(API + `/users/${id}/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `name=${name}&email=${email}`,
    }).then(() => loadUsers());
  };

  // DELETE
  const deleteUser = (id) => {
    fetch(API + `/users/${id}/delete`, {
      method: "POST",
    }).then(() => loadUsers());
  };

  return (
    <div style={{ padding: "40px" }}>
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
