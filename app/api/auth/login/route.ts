import { NextRequest } from 'next/server'
import { signAdminToken, ADMIN_COOKIE } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ ok: false, error: 'Mot de passe incorrect' }, { status: 401 })
  }

  const token = await signAdminToken()

  return Response.json({ ok: true }, {
    headers: {
      'Set-Cookie': `${ADMIN_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`,
    },
  })
}
