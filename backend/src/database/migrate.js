require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('🔗 Conectado ao MySQL...');

  // Criar banco de dados
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'agenda_juridica'}\``);
  await connection.query(`USE \`${process.env.DB_NAME || 'agenda_juridica'}\``);

  console.log('📦 Criando tabelas...');

  const sql = `
    -- Tabela de usuários
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      senha VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    -- Tabela de clientes
    CREATE TABLE IF NOT EXISTS clientes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      nome VARCHAR(255) NOT NULL,
      cpf VARCHAR(20),
      email VARCHAR(255),
      telefone VARCHAR(30),
      status ENUM('ativo', 'inativo') DEFAULT 'ativo',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    -- Tabela de processos
    CREATE TABLE IF NOT EXISTS processos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      numero VARCHAR(100) NOT NULL,
      cliente_nome VARCHAR(255) NOT NULL,
      tipo VARCHAR(100) NOT NULL,
      status ENUM('inicial', 'andamento', 'arquivado') DEFAULT 'inicial',
      data_inicio DATE,
      proxima_audiencia DATE,
      observacoes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    -- Tabela de agenda (eventos)
    CREATE TABLE IF NOT EXISTS agenda (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      titulo VARCHAR(255) NOT NULL,
      tipo ENUM('audiencia', 'reuniao', 'prazo', 'outros') DEFAULT 'outros',
      data DATE NOT NULL,
      hora TIME,
      cliente VARCHAR(255),
      processo VARCHAR(100),
      local VARCHAR(255),
      observacoes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    -- Tabela de alertas
    CREATE TABLE IF NOT EXISTS alertas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      tipo ENUM('prazo', 'audiencia', 'pagamento', 'documento', 'outros') DEFAULT 'outros',
      titulo VARCHAR(255) NOT NULL,
      mensagem TEXT,
      urgencia ENUM('alta', 'media', 'baixa') DEFAULT 'media',
      lido BOOLEAN DEFAULT FALSE,
      data_alerta DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    -- Tabela de financeiro (honorários)
    CREATE TABLE IF NOT EXISTS financeiro (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      cliente VARCHAR(255) NOT NULL,
      processo VARCHAR(100),
      valor DECIMAL(10,2) NOT NULL,
      data_vencimento DATE NOT NULL,
      data_pagamento DATE,
      status ENUM('pendente', 'pago', 'atrasado') DEFAULT 'pendente',
      forma_pagamento VARCHAR(50),
      observacoes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    -- Tabela de contratos
    -- ✅ CORRIGIDO: status inclui 'vencido' + coluna arquivo_resource_type adicionada
    CREATE TABLE IF NOT EXISTS contratos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      titulo VARCHAR(255) NOT NULL,
      cliente VARCHAR(255) NOT NULL,
      tipo VARCHAR(100),
      status ENUM('ativo', 'encerrado', 'pendente', 'vencido') DEFAULT 'ativo',
      data_inicio DATE,
      data_fim DATE,
      valor DECIMAL(10,2),
      arquivo_nome VARCHAR(500),
      arquivo_resource_type VARCHAR(10) DEFAULT 'raw',
      observacoes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );
  `;

  await connection.query(sql);

  console.log('✅ Migração concluída com sucesso!');
  console.log('📋 Tabelas criadas: usuarios, clientes, processos, agenda, alertas, financeiro, contratos');

  // ── Migrações incrementais ────────────────────────────────────────────────
  // Garante que bancos já existentes recebam as colunas/alterações novas
  // sem precisar recriar tudo do zero.
  console.log('🔄 Aplicando migrações incrementais...');

  const incrementais = [
    // Adiciona arquivo_resource_type se não existir
    `ALTER TABLE contratos ADD COLUMN IF NOT EXISTS arquivo_resource_type VARCHAR(10) DEFAULT 'raw'`,

    // Aumenta tamanho do arquivo_nome para suportar URLs longas do Cloudinary
    `ALTER TABLE contratos MODIFY COLUMN arquivo_nome VARCHAR(500)`,

    // Adiciona 'vencido' ao ENUM de status dos contratos
    `ALTER TABLE contratos MODIFY COLUMN status ENUM('ativo', 'encerrado', 'pendente', 'vencido') DEFAULT 'ativo'`,
  ]

  for (const query of incrementais) {
    try {
      await connection.query(query)
    } catch (e) {
      // Ignora erros de "coluna já existe" em bancos antigos que não suportam IF NOT EXISTS
      if (!e.message.includes('Duplicate column')) {
        console.warn(`⚠️  Aviso na migração incremental: ${e.message}`)
      }
    }
  }

  console.log('✅ Migrações incrementais aplicadas!');

  await connection.end();
}

migrate().catch((err) => {
  console.error('❌ Erro na migração:', err);
  process.exit(1);
});