"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Axios from '@/utils/Axios'
import { SummeryApi } from '@/app/common/SummeryApi'
import { DisplayPriceInAud } from '@/utils/DisplayPriceInAud'
import { PriceWithDiscount } from '@/utils/PriceWithDiscount'
import { validURLConvert } from '@/utils/validURLConvart'
import AddToCartButton from './UI/AddToCartBtn'

interface Product {
    id: string; title: string; images: string[]; price: number; discount: number
    pack?: string | null; absorbency?: string | null
}

const QUESTIONS = [
    { id: 'shopper', title: 'Who are you shopping for?', options: ['Myself', 'Someone I care for', 'An NDIS participant'] },
    { id: 'type', title: 'What type of protection?', options: ['Pads or liners', 'Pull up pants', 'Bed protection', 'Not sure yet'] },
    { id: 'absorbency', title: 'How much absorbency?', options: ['Light', 'Moderate', 'Heavy or overnight'] },
    { id: 'pack', title: 'Preferred pack?', options: ['A single pack', 'A monthly bundle', 'Show me everything'] },
] as const

const TYPE_KEYWORDS: Record<string, string[]> = {
    'Pads or liners': ['pad', 'liner'],
    'Pull up pants': ['pull-up', 'pullup', 'pants'],
    'Bed protection': ['bed', 'underpad', 'protector', 'bluey', 'mat'],
}
const ABSORBENCY_KEYWORDS: Record<string, string[]> = {
    'Light': ['light', 'mini'],
    'Moderate': ['moderate', 'regular', 'medium'],
    'Heavy or overnight': ['heavy', 'overnight', 'maxi', 'super', 'extra'],
}

const CALC_KEYWORDS: { label: string; keywords: string[] }[] = [
    { label: 'Pull up pants', keywords: ['pull-up', 'pullup', 'pants'] },
    { label: 'Pads', keywords: ['pad', 'liner'] },
    { label: 'Bed protection', keywords: ['bed', 'underpad', 'protector', 'bluey', 'mat'] },
]

const CHANGE_OPTS = [
    { label: '1 to 2', n: 1.5 },
    { label: '3 to 4', n: 3.5 },
    { label: '5 or more', n: 5.5 },
]

const packQty = (pack?: string | null) => {
    const m = (pack ?? '').match(/(\d+)/)
    return m ? Math.max(1, parseInt(m[1], 10)) : 1
}

const productUrl = (p: Product) => `/product/${validURLConvert(p.title)}_${p.id}`

const ProductFinderPanel = ({ allProducts }: { allProducts: Product[] }) => {
    const [step, setStep] = useState(-1) // -1 intro, 0..3 questions, 4 results
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [results, setResults] = useState<Product[]>([])
    const [loading, setLoading] = useState(false)

    const reset = () => { setStep(-1); setAnswers({}); setResults([]) }

    const answer = (option: string) => {
        const question = QUESTIONS[step]
        const updated = { ...answers, [question.id]: option }
        setAnswers(updated)
        const next = step + 1
        if (next < QUESTIONS.length) { setStep(next); return }
        setStep(4)
        setLoading(true)
        const typeKw = TYPE_KEYWORDS[updated.type] ?? []
        const absKw = ABSORBENCY_KEYWORDS[updated.absorbency] ?? []
        const wantsBundle = updated.pack === 'A monthly bundle'
        const wantsSingle = updated.pack === 'A single pack'
        const scored = allProducts
            .map((p) => {
                const title = p.title.toLowerCase()
                const abs = (p.absorbency ?? '').toLowerCase()
                let score = 0
                if (typeKw.some((k) => title.includes(k))) score += 3
                if (absKw.some((k) => abs.includes(k) || title.includes(k))) score += 2
                if (wantsBundle && /bundle|pack of (?:[2-9]\d|1\d\d)/i.test(p.pack ?? '')) score += 1
                if (wantsSingle && !/bundle/i.test(p.pack ?? '')) score += 1
                return { p, score }
            })
            .filter((s) => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .map((s) => s.p)
            .slice(0, 3)
        setResults(scored.length > 0 ? scored : allProducts.slice(0, 3))
        setLoading(false)
    }

    return (
        <div className="rounded-2xl p-6 md:p-8 border" style={{ background: 'rgba(255,255,255,.55)', borderColor: 'rgba(20,60,40,.14)' }}>
            <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center text-xl shrink-0">🧭</div>
                <div>
                    <h3 className="font-secondary text-xl text-text-hover">Product Finder</h3>
                    <p className="text-sm text-text">Not sure what to buy? Four questions and we match you.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-6 min-h-[420px] flex flex-col">
                {step === -1 && (
                    <div className="flex flex-col items-center text-center justify-center flex-1 gap-4">
                        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-2xl">🧭</div>
                        <h4 className="font-secondary text-2xl text-text-hover">Product match plus your costs</h4>
                        <p className="text-sm text-text">Four quick taps. No email needed.</p>
                        <button onClick={() => setStep(0)} className="bg-secondary hover:bg-secondary-hover text-background rounded-full px-6 py-3 font-semibold transition-colors">
                            Start →
                        </button>
                    </div>
                )}

                {step >= 0 && step <= 3 && (
                    <div className="flex flex-col flex-1">
                        <div className="flex gap-2 mb-2">
                            {QUESTIONS.map((_, i) => (
                                <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? 'bg-secondary' : 'bg-primary-hover'}`} />
                            ))}
                        </div>
                        <p className="text-xs text-text mb-4">Question {step + 1} of {QUESTIONS.length}</p>
                        <h4 className="font-secondary text-xl text-text-hover mb-4">{QUESTIONS[step].title}</h4>
                        <div className="flex flex-col gap-2 flex-1">
                            {QUESTIONS[step].options.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => answer(option)}
                                    className="text-left border border-primary-hover hover:border-secondary hover:bg-primary/40 text-text-hover font-medium text-sm rounded-xl px-4 py-3 transition-colors"
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                        <button onClick={reset} className="text-sm text-text underline mt-4 self-start">← Start over</button>
                    </div>
                )}

                {step === 4 && (
                    <div className="flex flex-col flex-1">
                        <h4 className="font-secondary text-xl text-text-hover mb-1">Your matches</h4>
                        <p className="text-sm text-text mb-4">Based on your answers, we recommend:</p>
                        {loading ? (
                            <div className="flex justify-center py-10 flex-1"><div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" /></div>
                        ) : results.length === 0 ? (
                            <p className="text-sm text-text py-6">No matches yet. <Link href="/products" className="text-secondary underline">Browse all products</Link></p>
                        ) : (
                            <div className="flex flex-col gap-3 flex-1">
                                {results.map((p) => (
                                    <div key={p.id} className="flex items-center gap-3 border border-primary-hover rounded-xl p-3">
                                        <div className="w-12 h-12 rounded-lg bg-primary overflow-hidden shrink-0">
                                            {p.images?.[0] && <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />}
                                        </div>
                                        <Link href={productUrl(p)} className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-text-hover leading-snug line-clamp-1">{p.title}</p>
                                            <p className="text-xs text-text">{DisplayPriceInAud(PriceWithDiscount(p.price, p.discount))}</p>
                                        </Link>
                                        <AddToCartButton data={p} />
                                    </div>
                                ))}
                            </div>
                        )}
                        <button onClick={reset} className="text-sm text-text underline mt-4 self-start">← Start over</button>
                    </div>
                )}
            </div>
        </div>
    )
}

const CostCalculatorPanel = ({ allProducts }: { allProducts: Product[] }) => {
    const tiles: Product[] = []
    for (const { keywords } of CALC_KEYWORDS) {
        const match = allProducts.find((p) => !tiles.includes(p) && keywords.some((k) => p.title.toLowerCase().includes(k)))
        if (match) tiles.push(match)
    }
    for (const p of allProducts) {
        if (tiles.length >= 3) break
        if (!tiles.includes(p)) tiles.push(p)
    }

    const [productId, setProductId] = useState<string | null>(null)
    const [changeIndex, setChangeIndex] = useState(1)

    useEffect(() => {
        if (!productId && tiles.length > 0) setProductId(tiles[0].id)
    }, [tiles, productId])

    const product = tiles.find((p) => p.id === productId) ?? tiles[0]
    const opt = CHANGE_OPTS[changeIndex]

    if (!product) {
        return (
            <div className="rounded-2xl p-6 md:p-8 bg-secondary text-background">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-xl shrink-0">🧮</div>
                    <div>
                        <h3 className="font-secondary text-xl">Cost Calculator</h3>
                        <p className="text-sm text-background/80">Already know what you need? See what it costs.</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 min-h-[420px] flex items-center justify-center text-text text-sm">
                    Add products in the admin panel to enable the calculator.
                </div>
            </div>
        )
    }

    const qty = packQty(product.pack)
    const unit = PriceWithDiscount(product.price, product.discount) / qty
    const weekly = unit * opt.n * 7
    const monthly = (weekly * 52) / 12
    const yearly = weekly * 52
    const packsAMonth = Math.ceil((opt.n * 31) / qty)

    return (
        <div className="rounded-2xl p-6 md:p-8 bg-secondary text-background">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-xl shrink-0">🧮</div>
                <div>
                    <h3 className="font-secondary text-xl">Cost Calculator</h3>
                    <p className="text-sm text-background/80">Already know what you need? See what it costs.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-6 min-h-[420px] flex flex-col text-text-hover">
                <p className="text-sm font-semibold mb-2">1 · Which product?</p>
                <div className="grid grid-cols-3 gap-2 mb-5">
                    {tiles.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setProductId(p.id)}
                            className={`rounded-lg px-2 py-2.5 text-xs font-semibold text-center leading-tight transition-colors border ${
                                p.id === product.id ? 'bg-secondary text-background border-secondary' : 'bg-white text-text-hover border-primary-hover hover:border-secondary'
                            }`}
                        >
                            {p.title}
                        </button>
                    ))}
                </div>

                <p className="text-sm font-semibold mb-2">2 · How many changes a day?</p>
                <div className="grid grid-cols-3 gap-2 mb-5">
                    {CHANGE_OPTS.map((o, i) => (
                        <button
                            key={o.label}
                            onClick={() => setChangeIndex(i)}
                            className={`rounded-lg px-2 py-2.5 text-xs font-semibold text-center transition-colors border ${
                                i === changeIndex ? 'bg-secondary text-background border-secondary' : 'bg-white text-text-hover border-primary-hover hover:border-secondary'
                            }`}
                        >
                            {o.label}
                        </button>
                    ))}
                </div>

                <div className="bg-primary/50 rounded-xl p-4 mt-auto">
                    <p className="text-xs font-semibold text-text tracking-wide mb-3">YOUR ESTIMATED COST</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="font-secondary text-lg text-secondary">{DisplayPriceInAud(weekly)}</p>
                            <p className="text-[11px] text-text">Weekly</p>
                        </div>
                        <div>
                            <p className="font-secondary text-lg text-secondary">{DisplayPriceInAud(monthly)}</p>
                            <p className="text-[11px] text-text">Monthly</p>
                        </div>
                        <div>
                            <p className="font-secondary text-lg text-secondary">{DisplayPriceInAud(yearly)}</p>
                            <p className="text-[11px] text-text">Yearly</p>
                        </div>
                    </div>
                    <p className="text-xs text-text mt-3 leading-snug">
                        {product.title} at {DisplayPriceInAud(unit)} each, about {packsAMonth} pack{packsAMonth === 1 ? '' : 's'} a month. An estimate, not a quote.
                    </p>
                </div>

                <Link
                    href="/apply/ndis"
                    className="mt-4 text-center bg-secondary hover:bg-secondary-hover text-background rounded-full py-3 font-semibold transition-colors"
                >
                    Get an exact quote →
                </Link>
            </div>
        </div>
    )
}

const ProductFinderCalculator = () => {
    const [allProducts, setAllProducts] = useState<Product[]>([])

    useEffect(() => {
        (async () => {
            try {
                const res = await Axios({ ...SummeryApi.fetchProducts })
                setAllProducts(res.data?.data ?? res.data ?? [])
            } catch {
                setAllProducts([])
            }
        })()
    }, [])

    return (
        <section id="finder" className="bg-[#d8e8dc] py-20">
            <div className="container mx-auto px-6">
                <div className="flex flex-col items-center text-center gap-3 mb-12">
                    <span className="bg-white/70 text-secondary font-semibold rounded-full px-4.5 py-2 text-sm">
                        Product Finder &amp; Cost Calculator
                    </span>
                    <h2 className="font-secondary text-4xl md:text-5xl text-text-hover tracking-tight max-w-2xl">
                        Want a quick cost estimate? Just answer a few questions
                    </h2>
                    <p className="text-base md:text-lg text-text max-w-2xl">
                        Use the finder if you do not know what to buy. Use the calculator if you already do and want to know the cost. No email, no sign up.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 items-start">
                    <ProductFinderPanel allProducts={allProducts} />
                    <CostCalculatorPanel allProducts={allProducts} />
                </div>
            </div>
        </section>
    )
}

export default ProductFinderCalculator
