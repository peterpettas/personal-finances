export async function fetchUpApi(endpoint: string) {
  const response = await fetch(process.env.UP_BANK_API_URL + endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.UP_BANK_API_KEY}`,
    },
  });
  if (!response.ok) {
	const errorText = await response.text();
    console.error(`Error text: ${errorText}`);
    throw new Error(`Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}