const bcrypt = require('bcryptjs');
const { getDB } = require('./database');

const db = getDB();
const hash = bcrypt.hashSync('00207DylanRamirezLopez', 12);

db.prepare(`INSERT OR IGNORE INTO users (name, email, password) VALUES (?, ?, ?)`)
  .run('Administrador', 'admin', hash);

// Also update if exists
db.prepare(`UPDATE users SET password = ?, name = ? WHERE email = ?`)
  .run(hash, 'Administrador', 'admin');

console.log('Usuario admin actualizado:');
console.log('  Usuario: admin');
console.log('  Password: [PROTEGIDO - bcrypt con 12 rondas]');
console.log('  Hash:', hash);
