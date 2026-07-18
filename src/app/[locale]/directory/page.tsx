import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'A-Z Anime & Manga Directory | Animy',
    description: 'Browse our complete A-Z directory of all anime and manga titles on Animy. Discover rare, classic, and trending series.',
    keywords: ['anime directory', 'manga directory', 'a-z anime list', 'all anime list', 'all manga list']
};

export default function DirectoryPage() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const numbers = '0123456789'.split('');

    return (
        <div className="min-h-screen bg-background text-foreground py-20 px-4 md:px-8 max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-black mb-6">A-Z Directory</h1>
            <p className="text-muted-foreground text-lg mb-12 max-w-2xl">
                Browse our complete collection of anime and manga alphabetically. Whether you are looking for a popular hit or a rare classic, our directory makes it easy to find what you want to watch or read.
            </p>

            <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-primary">Browse by Letter</h2>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 lg:grid-cols-13 gap-3">
                    {alphabet.map((letter) => (
                        <Link 
                            key={letter} 
                            href={`/anime?letter=${letter}`}
                            className="flex items-center justify-center p-4 bg-secondary border border-white/5 hover:border-primary/50 hover:bg-primary/10 rounded-xl transition-all font-bold text-xl hover:scale-105"
                        >
                            {letter}
                        </Link>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-6 text-primary">Browse by Number</h2>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                    {numbers.map((number) => (
                        <Link 
                            key={number} 
                            href={`/anime?letter=${number}`}
                            className="flex items-center justify-center p-4 bg-secondary border border-white/5 hover:border-primary/50 hover:bg-primary/10 rounded-xl transition-all font-bold text-xl hover:scale-105"
                        >
                            {number}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
