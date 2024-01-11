import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import { config } from "dotenv";
import fs from "fs";
import csvParser from "csv-parser";

config();

const app = express();
const port = 3000;

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

db.connect();

// Verificar y crear la tabla si no existe
db.query(`
  CREATE TABLE IF NOT EXISTS visited_countries (
    id SERIAL PRIMARY KEY,
    country_code VARCHAR(2) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS countries(
    id SERIAL PRIMARY KEY,
    country_code CHAR(2),
    country_name VARCHAR(100)
  )
`).catch(err => console.error('Error creating table:', err));

// Eliminar datos existentes de la tabla "countries"
// db.query('DELETE FROM visited_countries').catch(err => console.error('Error deleting existing data:', err));

// // Cargar datos desde el archivo CSV a la tabla "countries"
// const csvFilePath = "countries.csv"; // Cambia esto con la ruta correcta de tu archivo CSV
// const rows = [];

// fs.createReadStream(csvFilePath)
//   .pipe(csvParser())
//   .on("data", (row) => {
//     rows.push(row);
//   })
//   .on("end", async () => {
//     // Insertar datos en la tabla "countries"
//     for (const country of rows) {
//       try {
//         const countryQuery = {
//           text: 'INSERT INTO countries (country_code, country_name) VALUES ($1, $2)',
//           values: [country.country_code, country.country_name],
//         };

//         await db.query(countryQuery);
//         console.log(`Country ${country.country_name} inserted successfully`);
//       } catch (error) {
//         console.error(`Error inserting country ${country.country_name}:`, error);
//       }
//     }

//     console.log("Datos cargados desde CSV a la tabla 'countries'");
//   });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  const result = await db.query(
    "SELECT country_code FROM visited_countries "
  );

  let countries = [];

  result.rows.forEach((row) => {
    countries.push(row.country_code);
  });

  console.log(result.rows);

  res.render("index.ejs", { countries: countries, total: countries.length });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const result = await db.query(
    "SELECT country_code FROM countries WHERE country_name = $1",
    [input]
  );

  console.log("result", result.rowCount);
  if (result.rows.length !== 0) {
    const data = result.rows[0];

    const countryCode = data.country_code;

    await db.query(
      "INSERT INTO visited_countries (country_code) VALUES ($1)",
      [countryCode]
    );
    res.redirect("/");
    console.log("data", data);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
