import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) redirect('/admin/login')
  return <>{children}</>
}
