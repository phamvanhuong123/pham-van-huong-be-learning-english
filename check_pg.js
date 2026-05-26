const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgres://postgres:123456@localhost:5432/learning_english_toiec?schema=public",
  });
  await client.connect();

  const res = await client.query("SELECT * FROM \"Exam\" WHERE title = 'FullTest'");
  if (res.rows.length === 0) {
    console.log("No FullTest found");
    return;
  }
  const exam = res.rows[0];
  console.log("Exam:", exam);

  const pgRes = await client.query("SELECT * FROM \"PassageGroup\" WHERE \"examId\" = $1", [exam.id]);
  console.log("PassageGroups:", pgRes.rows.length);

  const qRes = await client.query("SELECT * FROM \"Question\" WHERE \"examId\" = $1", [exam.id]);
  console.log("Questions:", qRes.rows.length);

  await client.end();
}
main().catch(console.error);
