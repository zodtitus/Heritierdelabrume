import heritieursData from '@/data/heritiers.json'
import AdminEditor from '@/components/AdminEditor'
import type { Heritier } from '@/lib/types'

export default function AdminPage() {
  return <AdminEditor initialData={heritieursData as Heritier[]} />
}
