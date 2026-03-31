// lib/ais.ts

export async function getAisAccessToken() {
  const params = new URLSearchParams({
    client_id: process.env.AIS_SMS_CLIENT_ID!,
    client_secret: process.env.AIS_SMS_CLIENT_SECRET!,
    grant_type: 'client_credentials',
  })

  const res = await fetch('https://smsapi.ais.co.th/auth/v3.2/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    throw new Error(`AIS auth failed: ${await res.text()}`)
  }

  const data = await res.json()

  return data.access_token
}
export async function sendSMS({
  phone,
  message,
}: {
  phone: string
  message: string
}) {
  const token = await getAisAccessToken()

  const res = await fetch(
    'https://smsapi.ais.co.th/api/v1/nmgw/sendmsg/'+process.env.AIS_SERVICE_ID,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderName: process.env.AIS_SMS_SENDER_ID,
        destinationNumber: phone,
        serviceNumber: process.env.AIS_SERVICE_NO,
        content: message,
      }),
    }
  )

  if (!res.ok) {
    throw new Error(`AIS send SMS failed: ${await res.text()}`)
  }

  return res.json()
}