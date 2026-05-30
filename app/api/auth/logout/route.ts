import { ADMIN_COOKIE } from '@/lib/auth'

export async function POST() {
  return Response.json({ ok: true }, {
    headers: {
      'Set-Cookie': `${ADMIN_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`,
    },
  })
}
