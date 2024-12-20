const { Pool } = require("pg");
const format = require('pg-format');

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    password: "password",
    database: "joyas",
    port: 5432,
    allowExitOnIdle: true
});

const obtenerJoyas = async ({ limit = 10, order_by = "id_ASC", page = 1 }) => {
  const [campo, direccion] = order_by.split("_");
  const camposPermitidos = ["id", "nombre", "categoria", "metal", "precio", "stock"];
  if (!camposPermitidos.includes(campo) || !["ASC", "DESC"].includes(direccion.toUpperCase())) {
      throw new Error("Parámetros de ordenación inválidos.");
  }
  const offset = Math.max(0, (page - 1) * limit);
  const formattedQuery = format(
      "SELECT * FROM inventario ORDER BY %s %s LIMIT %s OFFSET %s",
      campo,
      direccion.toUpperCase(),
      limit,
      offset
  );
  const { rows: joyas } = await pool.query(formattedQuery);
  return joyas;
};
  
const prepararHATEOAS = (joyas) => {
    const results = joyas.map((m) => ({
        name: m.nombre,
        href: `http://localhost:3000/joyas/${m.id}`
    }));
    const total = joyas.length;
    return { total, results };
};

  
const obtenerJoyasPorFiltros = async ({ precio_min, precio_max, categoria, metal }) => {
    let filtros = [];
    let valores = [];
    
    if (precio_max) {
      filtros.push(`precio <= $${filtros.length + 1}`);
      valores.push(precio_max);
    }
    if (precio_min) {
      filtros.push(`precio >= $${filtros.length + 1}`);
      valores.push(precio_min);
    }
    if (categoria) {
      filtros.push(`categoria = $${filtros.length + 1}`);
      valores.push(categoria);
    }
    if (metal) {
      filtros.push(`metal = $${filtros.length + 1}`);
      valores.push(metal);
    }
  
    let consulta = "SELECT * FROM inventario";
    if (filtros.length > 0) {
      consulta += ` WHERE ${filtros.join(" AND ")}`;
    }
  
    try {
      const { rows: joyas } = await pool.query(consulta, valores);
      return joyas;
    } catch (error) {
      throw new Error("Error al filtrar joyas: " + error.message);
    }
  };
    module.exports = { pool, obtenerJoyas, prepararHATEOAS, obtenerJoyasPorFiltros };