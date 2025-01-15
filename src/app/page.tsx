export default async function HomePage() {
  const res = await fetch("http://localhost:3000/api");
  const data = await res.text();

  return data;
}
