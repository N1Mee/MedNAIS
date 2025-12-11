import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { session_id: string } }
) {
  try {
    const sessionId = params.session_id;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Forward request to FastAPI backend
    const backendUrl = `http://localhost:8001/api/stripe/checkout-status/${sessionId}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || 'Failed to get checkout status' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Checkout status error:', error);
    return NextResponse.json(
      { error: 'Failed to get checkout status' },
      { status: 500 }
    );
  }
}
