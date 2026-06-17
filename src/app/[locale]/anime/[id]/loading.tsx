
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="min-h-screen">
            {/* Hero Skeleton */}
            <div className="relative h-[500px] w-full bg-muted/20">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
            </div>

            <div className="container -mt-64 relative z-20">
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Poster Skeleton */}
                    <div>
                        <Card className="overflow-hidden">
                            <div className="relative aspect-[2/3]">
                                <Skeleton className="w-full h-full" />
                            </div>
                            <CardContent className="p-4 space-y-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Info Skeleton */}
                    <div className="md:col-span-2 space-y-6">
                        <div>
                            <Skeleton className="h-10 w-3/4 mb-2" />
                            <Skeleton className="h-6 w-1/2" />
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4">
                            <Skeleton className="h-20 w-32" />
                            <Skeleton className="h-20 w-32" />
                            <Skeleton className="h-20 w-32" />
                        </div>

                        {/* Genres */}
                        <div className="flex gap-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-20" />
                        </div>

                        {/* Synopsis */}
                        <div>
                            <Skeleton className="h-8 w-40 mb-3" />
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>

                        {/* Details Card */}
                        <Card>
                            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
