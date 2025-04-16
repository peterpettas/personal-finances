import { NextResponse } from 'next/server';
import { fetchUpApi } from '../../../../lib/api';

export async function PATCH(req, { params }) {
  const { transactionId } = params;
  
  try {
    // Make sure the transaction ID is valid
    if (!transactionId || typeof transactionId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid transaction ID' }, 
        { status: 400 }
      );
    }
    
    // Get the category data from the request body
    const categoryData = await req.json();
    
    // Construct the URL for the UP API
    const url = `transactions/${transactionId}/relationships/category`;
    
    // Make the request to the UP API with the appropriate payload
    const response = await fetchUpApi(url, {
      method: 'PATCH',
      body: JSON.stringify(categoryData)
    });
    
    // Return a 204 No Content response on success (as specified in the bank's API)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error updating transaction category:', error);
    
    // Return an appropriate error response
    return NextResponse.json(
      { error: error.message || 'Failed to update transaction category' },
      { status: error.status || 500 }
    );
  }
}