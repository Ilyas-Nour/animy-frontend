'use client'
export const runtime = 'edge';
import { EditProfileForm } from '@/components/dashboard/EditProfileForm'

export default function EditProfilePage() {
  return (
    <div className="container py-12">
      <EditProfileForm />
    </div>
  )
}