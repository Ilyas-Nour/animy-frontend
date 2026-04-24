'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

export default function DiagnosticPage() {
    const [results, setResults] = useState<any>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const runTests = async () => {
            const tests: any = {}

            // Test 1: Can we reach the backend?
            try {
                const res = await fetch('http://localhost:3001/api/v1/anime/top?limit=1')
                tests.backendReachable = res.ok
                tests.backendStatus = res.status
            } catch (e: any) {
                tests.backendReachable = false
                tests.backendError = e.message
            }

            // Test 2: Can api wrapper reach it?
            try {
                const res = await api.get('/anime/top?limit=1')
                tests.apiWorks = true
                tests.apiData = res.data
            } catch (e: any) {
                tests.apiWorks = false
                tests.apiError = e.message
                tests.apiResponse = e.response?.data
            }

            // Test 3: Can we get anime details?
            try {
                const res = await api.get('/anime/5')
                tests.animeDetailsWorks = true
                tests.animeTitle = res.data.data?.title
            } catch (e: any) {
                tests.animeDetailsWorks = false
                tests.animeError = e.message
            }

            // Test 4: Environment variables
            tests.apiUrl = process.env.NEXT_PUBLIC_API_URL
            tests.frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL

            setResults(tests)
            setLoading(false)
        }

        runTests()
    }, [])

    if (loading) {
        return <div className="p-8">Running diagnostics...</div>
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">System Diagnostics</h1>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(results, null, 2)}
            </pre>
        </div>
    )
}
