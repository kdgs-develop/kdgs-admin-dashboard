export async function POST(request: Request) {
  console.log("Test webhook endpoint hit!");
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
