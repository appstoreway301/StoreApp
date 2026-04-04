const pool = require('./connection');

const EMAIL = process.argv[2];

if (!EMAIL) {
  console.error('Uso: node src/db/delete-user.js <email>');
  process.exit(1);
}

(async () => {
  const { rows } = await pool.query('SELECT id, email, name FROM users WHERE email = $1', [EMAIL]);

  if (rows.length === 0) {
    console.log(`No se encontró usuario con email: ${EMAIL}`);
    await pool.end();
    process.exit(0);
  }

  const user = rows[0];
  const userId = user.id;

  console.log(`Eliminando usuario: ${user.name} (${user.email}) - ID: ${userId}`);

  // Eliminar order_items de las órdenes del usuario
  await pool.query(
    'DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1)',
    [userId]
  );
  console.log('  - order_items eliminados');

  // Eliminar órdenes
  const { rowCount: orders } = await pool.query('DELETE FROM orders WHERE user_id = $1', [userId]);
  console.log(`  - ${orders} órdenes eliminadas`);

  // Eliminar cart_items (CASCADE lo haría, pero por claridad)
  const { rowCount: cart } = await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
  console.log(`  - ${cart} items del carrito eliminados`);

  // Eliminar pending_verifications
  const { rowCount: pv } = await pool.query('DELETE FROM pending_verifications WHERE email = $1', [EMAIL]);
  console.log(`  - ${pv} verificaciones pendientes eliminadas`);

  // Eliminar usuario
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  console.log(`  - Usuario eliminado`);

  console.log('Listo.');
  await pool.end();
})();
