const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_OBqQn5CNbHd9@ep-withered-mouse-adqo34mz-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function checkDatabase() {
    try {
        console.log('Connecting to database...');
        const now = await pool.query('SELECT NOW()');
        console.log('✓ Connected at:', now.rows[0].now);
        
        const tables = await pool.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname='public'
            ORDER BY tablename
        `);
        
        console.log('\n📊 Tables found:', tables.rows.length);
        if (tables.rows.length > 0) {
            tables.rows.forEach(t => console.log('  ✓', t.tablename));
        } else {
            console.log('\n⚠️  NO TABLES FOUND IN DATABASE!');
            console.log('\n🔧 To restore, run this in your Neon SQL console:');
            console.log('   backend/recreate_tables.sql');
        }
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.log('\nPossible solutions:');
        console.log('1. Check if your Neon database is still active');
        console.log('2. Verify connection string in .env file');
        console.log('3. Check Neon dashboard for database status');
    } finally {
        await pool.end();
    }
}

checkDatabase();
