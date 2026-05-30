import { getHeritiers } from '@/lib/db'
import AdminEditor from '@/components/AdminEditor'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const heritiers = await getHeritiers()
  return <AdminEditor initialData={heritiers} />
}
