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

// export async function fetchTransactionCategory(categoryLink: string) {
//   const response = await fetch(categoryLink, {
//     method: 'GET',
//     headers: {
//       Authorization: `Bearer ${process.env.UP_BANK_API_KEY}`,
//     },
//   });

//   if (!response.ok) {
// 	console.error(`Error fetching category from ${categoryLink}: ${response.status}`);
//     return 'Uncategorized'; 
//     // throw new Error(`Error: ${response.status}`);
//   }

//   const data = await response.json();
//   return data.data ? data.data.id : 'Uncategorized';
// }