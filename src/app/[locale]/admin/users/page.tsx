'use client'

import { useEffect, useState } from 'react'
import {
    Search,
    MoreVertical,
    Shield,
    User as UserIcon,
    Trash2,
    CheckCircle2,
    Circle,
    Mail
} from 'lucide-react'
import api from '@/lib/api'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { getAvatarUrl } from '@/lib/utils'
import Image from 'next/image'
import UserAvatar from '@/components/common/UserAvatar'
import Link from 'next/link'
import { toast } from 'sonner'

export default function UserManagementPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users')
            // Handle both raw array and wrapped { data: [] } responses
            const usersData = Array.isArray(res.data) ? res.data : res.data?.data || []
            setUsers(Array.isArray(usersData) ? usersData : [])
        } catch (error) {
            console.error('Failed to fetch users', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            await api.put(`/admin/users/${userId}/role`, { role: newRole })
            fetchUsers()
        } catch (error) {
            console.error('Failed to update role', error)
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
        try {
            await api.delete(`/admin/users/${userId}`)
            fetchUsers()
        } catch (error) {
            console.error('Failed to delete user', error)
        }
    }

    const filteredUsers = Array.isArray(users) ? users.filter(user =>
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        (user.username && user.username.toLowerCase().includes(search.toLowerCase()))
    ) : []

    return (
        <div className="space-y-6 sm:space-y-8 px-4 sm:px-0 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">User <span className="text-primary italic">Management</span></h1>
                    <p className="text-muted-foreground font-medium mt-1">Manage accounts and permissions.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        className="pl-10 rounded-xl h-10 sm:h-11 shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Mobile View: Cards */}
            <div className="grid gap-4 md:hidden">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />)
                ) : (
                    filteredUsers.map((user) => (
                        <Card key={user.id} className="shadow-md bg-card/60 backdrop-blur-sm overflow-hidden p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <UserAvatar user={user} size="md" className="shadow-sm" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-sm truncate">{user.username || 'Anonymous'}</span>
                                        <span className="text-[10px] text-muted-foreground truncate opacity-70 italic">{user.email}</span>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/admin/users/${user.id}`} className="flex items-center gap-2 cursor-pointer w-full">
                                                <UserIcon className="w-4 h-4 text-primary" /> View & Edit Profile
                                            </Link>
                                        </DropdownMenuItem>
                                        {user.role === 'USER' ? (
                                            <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'ADMIN')} className="gap-2">
                                                <Shield className="w-4 h-4 text-blue-500" /> Make Admin
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'USER')} className="gap-2">
                                                <UserIcon className="w-4 h-4 text-muted-foreground" /> Make User
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="gap-2 text-destructive focus:text-destructive">
                                            <Trash2 className="w-4 h-4" /> Delete Account
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                <div className="flex gap-2">
                                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="rounded-md font-bold text-[9px] uppercase">
                                        {user.role}
                                    </Badge>
                                    {user.emailVerified ? (
                                        <Badge className="bg-green-500/10 text-green-500 border-none font-bold text-[9px] px-2 py-0.5 rounded-full">Verified</Badge>
                                    ) : (
                                        <Badge className="bg-orange-500/10 text-orange-500 border-none font-bold text-[9px] px-2 py-0.5 rounded-full">Pending</Badge>
                                    )}
                                </div>
                                <span className="text-[10px] font-bold text-muted-foreground opacity-40">
                                    Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Desktop View: Table */}
            <Card className="shadow-xl hidden md:block bg-card/40 backdrop-blur-md overflow-hidden sm:rounded-3xl">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="border-border">
                                <TableHead className="w-[300px] font-black uppercase text-[10px] tracking-widest pl-6">User</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest">Role</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest">Joined Date</TableHead>
                                <TableHead className="text-right font-black uppercase text-[10px] tracking-widest pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={5} className="h-16 bg-muted/20 animate-pulse" />
                                    </TableRow>
                                ))
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-primary/5 transition-colors border-border group">
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-3">
                                                <UserAvatar user={user} size="sm" className="group-hover:scale-110 transition-transform shadow-sm" />
                                                <div className="flex flex-col">
                                                    <Link href={`/admin/users/${user.id}`} className="font-bold text-sm hover:text-primary transition-colors">
                                                        {user.username || 'Anonymous'}
                                                    </Link>
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 opacity-60">
                                                        <Mail className="w-3 h-3" /> {user.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="rounded-md font-black text-[9px] tracking-wider uppercase">
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {user.emailVerified ? (
                                                    <div className="flex items-center gap-1.5 text-[10px] text-green-500 font-black bg-green-500/10 px-3 py-1 rounded-full uppercase tracking-tighter">
                                                        <CheckCircle2 size={12} /> Verified
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-[10px] text-orange-500 font-black bg-orange-500/10 px-3 py-1 rounded-full uppercase tracking-tighter">
                                                        <Circle size={12} /> Pending
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm font-bold opacity-70">
                                            {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                        <MoreVertical className="w-4 h-4 opacity-40 hover:opacity-100" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/users/${user.id}`} className="flex items-center gap-2 cursor-pointer w-full">
                                                            <UserIcon className="w-4 h-4 text-primary" /> View & Edit Profile
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    {user.role === 'USER' ? (
                                                        <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'ADMIN')} className="gap-2">
                                                            <Shield className="w-4 h-4 text-blue-500" /> Make Admin
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'USER')} className="gap-2">
                                                            <UserIcon className="w-4 h-4 text-muted-foreground" /> Make User
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="gap-2 text-destructive focus:text-destructive">
                                                        <Trash2 className="w-4 h-4" /> Delete Account
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                            {!loading && filteredUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                                        No users found matching your search.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
