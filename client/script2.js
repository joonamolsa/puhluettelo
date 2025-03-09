// Serverin käynnistys
// cd C:\NET\WebOhjelmointi1\puhluettelo\server
// json-server --watch db.json

(loadPage = () => {
  fetch("http://localhost:3000/items")
    .then((res) => res.json())
    .then((data) => {
      displayUser(data);
    });
})();

const userDisplay = document.querySelector(".table"); //haetaan taulukko elementti

// Funktio, joka näyttää kaikki käyttäjät
const displayUser = (data) => {
  // Tyhjennetään taulukko ennen uuden datan lisäämistä
  userDisplay.innerHTML = `
      <thead>
        <tr>
            <th>Id</th>
            <th>Nimi</th>
            <th>Puhelin</th>
            <th>Poista</th>
            <th>Muokkaa</th>
        </tr>
      </thead>
      <tbody></tbody>
  `;

  // Haetaan taulukon runko (tbody)
  const tbody = userDisplay.querySelector("tbody");

  // Lisätään jokainen rivi taulukkoon
  data.forEach((user) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${user.id}</td>
        <td>${user.nimi}</td>
        <td>${user.puhelin}</td>
        <td><input type="button" onClick="removeRow('${user.id}')" value="X"/></td>
        <td><input type="button" onClick="editRow('${user.id}')" value="Muokkaa"/></td>
    `;
    tbody.appendChild(row);
  });
};

const updateTableRow = (id, newPhone) => {
  const rows = document.querySelectorAll(".table tbody tr");

  rows.forEach((row) => {
    if (row.cells[0].textContent === id) {
      row.cells[2].textContent = newPhone; // Päivitetään vain puhelinnumero
    }
  });
};

// Rivin päivittäminen
const editRow = async (id) => {
  let polku = `http://localhost:3000/items/${id}`;
  try {
    const response = await fetch(polku);
    if (!response.ok) {
      throw new Error("Virhe tietojen haussa");
    }

    const userData = await response.json();

    // Täytetään nimi ja asetetaan readonly, jotta sitä ei voi muokata
    const nimiInput = document.getElementById("nimi");
    nimiInput.value = userData.nimi;
    nimiInput.readOnly = true; // Estää käyttäjää muuttamasta nimeä

    // Täytetään puhelinnumero
    document.getElementById("puhelin").value = userData.puhelin;

    // Tallennetaan muokattava ID lomakkeeseen
    document.getElementById("puhelintieto_lomake").dataset.editingId =
      userData.id;
  } catch (error) {
    console.error("Virhe muokkauksessa:", error);
  }
};

// Poistetaan rivi taulukosta
removeRow = async (id) => {
  console.log(id);
  let polku = `http://localhost:3000/items/${id}`;
  await fetch(polku, { method: "DELETE" });
  window.location.reload(); //ladataan sivu uudelleen
};

// Funktio käsittelee lomakkeen lähetyksen
async function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const url = form.action;

  try {
    const formData = new FormData(form);
    const plainFormData = Object.fromEntries(formData.entries());

    // Tarkistetaan, onko kyseessä muokkaus vai uusi lisäys
    const editingId = form.dataset.editingId;
    if (editingId) {
      // Haetaan olemassa oleva käyttäjä, jotta nimi säilyy
      const response = await fetch(
        `http://localhost:3000/items/${encodeURIComponent(editingId)}`
      );
      if (!response.ok) throw new Error("Virhe tietojen haussa");
      const existingData = await response.json();

      // Päivitetään vain puhelinnumero, nimi säilyy
      existingData.puhelin = plainFormData.puhelin;

      await fetch(
        `http://localhost:3000/items/${encodeURIComponent(editingId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(existingData),
        }
      );

      // Päivitetään vain yksi rivi taulukossa ilman koko sivun päivitystä
      updateTableRow(editingId, existingData.puhelin);

      // Tyhjennetään muokkaustila
      delete form.dataset.editingId;
    } else {
      // Luo uusi yhteystieto
      plainFormData.id = String(Date.now()); // Varmistaa, että ID on merkkijono
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(plainFormData),
      });
      const newUser = await response.json(); // Haetaan vastaus palvelimelta

      // Lisätään uusi rivi taulukkoon ilman koko taulukon päivitystä
      addTableRow(newUser);
    }
    // Tyhjennetään lomake syötön jälkeen
    form.reset();
  } catch (error) {
    console.error(error);
  }
}

const exampleForm = document.getElementById("puhelintieto_lomake");
exampleForm.addEventListener("submit", handleFormSubmit);
