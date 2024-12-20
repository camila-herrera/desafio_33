const express = require('express')
const app = express()
const fs = require("fs");
app.listen(3000, console.log('Servidor activado :)'))

const { pool, prepararHATEOAS, obtenerJoyas, obtenerJoyasPorFiltros } = require("./consultas");

app.use((req, res, next) => {
  const log = `${new Date().toISOString()} - Ruta consultada: ${req.method} ${req.url}\n`;
  fs.appendFileSync("log.txt", log);
  next();
});

app.use(express.json());

app.get("/joyas", async (req, res) => {
  try {
      const queryStrings = req.query;
      const joyas = await obtenerJoyas(queryStrings);
      const HATEOAS = prepararHATEOAS(joyas);
      res.json(HATEOAS);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

app.get("/joyas/filtros", async (req, res) => {
  try {
      const queryStrings = req.query;
      const joyas = await obtenerJoyasPorFiltros(queryStrings);
      res.json(joyas);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

app.get("/joyas/:id", async (req, res) => {
  try {
      const { id } = req.params;
      const consulta = "SELECT * FROM inventario WHERE id = $1";
      const { rows: [joya] } = await pool.query(consulta, [id]);
      if (!joya) {
          return res.status(404).json({ error: "Joya no encontrada" });
      }
      res.json(joya);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send(`
    <h1>API REST - Inventario de Joyas</h1>
    <h5>by Camila Herrera</h5>
    <p>Endpoints disponibles:</p>
    <ul>
      <li><b>GET /joyas</b> - Obtener joyas con HATEOAS</li>
      <li><b>GET /joyas/filtros</b> - Filtrar joyas por precio, categoría o metal</li>
      <li><b>GET /joyas/:id</b> - Obtener detalles de una joya específica</li>
    </ul>
    <p>Parámetros para <b>/joyas</b>:</p>
    <ul>
      <li>limit: Número máximo de resultados (default: 10)</li>
      <li>order_by: Campo y orden (ejemplo: precio_DESC, default: id_ASC)</li>
      <li>page: Número de página (default: 1)</li>
    </ul>
    <p>Parámetros para <b>/joyas/filtros</b>:</p>
    <ul>
      <li>precio_min: Filtrar joyas con precio mínimo</li>
      <li>precio_max: Filtrar joyas con precio máximo</li>
      <li>categoria: Filtrar por categoría</li>
      <li>metal: Filtrar por metal</li>
    </ul>
  `);
});