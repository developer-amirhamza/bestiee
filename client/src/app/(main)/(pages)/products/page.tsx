"use client";
import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { fetchCategories } from '@/redux/slices/categorySlice';
import Axios from '@/utils/Axios';
import { SummeryApi } from '@/app/common/SummeryApi';
import AxiosToastError from '@/utils/AxiosToastError';
import InfiniteScroll from 'react-infinite-scroll-component';
import Link from 'next/link';
import { DisplayPriceInAud } from '@/utils/DisplayPriceInAud';
import { PriceWithDiscount } from '@/utils/PriceWithDiscount';
import { validURLConvert } from '@/utils/validURLConvart';
import AddToCartButton from '../../components/UI/AddToCartBtn';
import Loader from '../../components/UI/Loader';

interface Product {
    id: string;
    title: string;
    description?: string;
    price: number;
    images: string[];
    discount: number;
    stock: number;
    isFeatured?: boolean;
    category?: { id: string; title: string; slug: string };
}

// Bestiee brand palette (same tokens used across the site's marketing pages).
const C = {
    teal: '#1f8049',
    tealD: '#0e4127',
    sage: '#d8e8dc',
    accent: '#d9772e',
    line: '#e7dfd1',
    muted: '#5c6a64',
    ink: '#20302C',
    bg: '#F4EFE6',
};

const SORTS = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to high' },
    { value: 'price_desc', label: 'Price: High to low' },
];

const ProductsContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { categories } = useSelector((state: RootState) => state.categorySlice);

    // Filter values live in the URL, same as before — shareable/back-button-safe.
    const textSearch = searchParams.get('q') || '';
    const categoryId = searchParams.get('category') || '';
    const inStockOnly = searchParams.get('inStock') === 'true';
    const sort = searchParams.get('sort') || 'newest';

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPage, setTotalPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const loadingArrayCard = new Array(9).fill(null);

    useEffect(() => {
        if (categories.length === 0) {
            dispatch(fetchCategories());
        }
    }, [dispatch, categories.length]);

    // Single source of truth for the product list — category, stock and sort
    // all flow through the same real search endpoint as text search.
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 20 };
            if (textSearch) params.q = textSearch;
            if (categoryId) params.category = categoryId;
            if (inStockOnly) params.inStock = 'true';
            if (sort) params.sort = sort;

            const response = await Axios({ ...SummeryApi.searchProduct, params });

            const newProducts = response.data?.data || [];
            const totalPages = response.data?.totalNoPage || 1;

            if (page === 1) {
                setProducts(newProducts);
            } else {
                setProducts((prev) => [...prev, ...newProducts]);
            }
            setTotalPage(totalPages);
            setHasMore(page < totalPages);
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    }, [textSearch, categoryId, inStockOnly, sort, page]);

    // Reset pagination whenever a filter changes.
    useEffect(() => {
        setPage(1);
        setProducts([]);
        setHasMore(true);
    }, [textSearch, categoryId, inStockOnly, sort]);

    useEffect(() => {
        fetchProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchProducts, page]);

    const updateFilters = (updates: Record<string, string | undefined>) => {
        const newParams = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value) newParams.set(key, value);
            else newParams.delete(key);
        });
        router.push(`/products?${newParams.toString()}`);
    };

    const clearFilters = () => router.push('/products');

    const handleFetchMore = () => {
        if (hasMore && !loading) setPage((prev) => prev + 1);
    };

    const activeSort = SORTS.find((s) => s.value === sort) ?? SORTS[0];

    return (
        <div style={{ background: C.bg, minHeight: '100vh' }}>
            {/* Hero */}
            <section style={{ background: C.sage }}>
                <div className="max-w-310 mx-auto px-5 sm:px-7 pt-10 pb-9">
                    <div className="text-sm" style={{ color: C.tealD, opacity: 0.75 }}>
                        <Link href="/">Home</Link> / Shop
                    </div>
                    <h1
                        className="font-serif"
                        style={{ fontSize: 'clamp(32px, 5vw, 48px)', lineHeight: 1.08, margin: '10px 0 8px', color: C.ink, fontWeight: 500 }}
                    >
                        Shop all products
                    </h1>
                    <p style={{ fontSize: 18, color: C.tealD, lineHeight: 1.5, margin: 0, maxWidth: '60ch' }}>
                        Pads, pull-up pants, bed pads and skincare. Every order ships in plain, unmarked packaging.
                    </p>
                    <div className="flex gap-2.5 mt-5 flex-wrap">
                        {['✓ NDIS and Support at Home claimable', '✓ Free delivery over $99', '✓ Same day dispatch before 2pm'].map((t) => (
                            <span key={t} className="bg-white rounded-full px-4 py-2 text-sm font-semibold" style={{ color: C.tealD }}>
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            <section className="max-w-310 mx-auto px-5 sm:px-7 py-9 pb-16 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 items-start">
                {/* Sidebar */}
                <aside className="flex flex-col gap-6 lg:sticky lg:top-6">
                    <div>
                        <div className="font-bold text-lg mb-2.5" style={{ color: C.ink }}>Category</div>
                        <div className="flex flex-col gap-1.5">
                            <button
                                onClick={() => updateFilters({ category: undefined })}
                                className="text-left text-[16px] flex justify-between gap-2.5 py-0.5"
                                style={{ color: !categoryId ? C.tealD : C.ink, fontWeight: !categoryId ? 700 : 400 }}
                            >
                                All Categories
                            </button>
                            {categories.map((cat: any) => {
                                const on = categoryId === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => updateFilters({ category: cat.id })}
                                        className="text-left text-[16px] flex justify-between gap-2.5 py-0.5"
                                        style={{ color: on ? C.tealD : C.ink, fontWeight: on ? 700 : 400 }}
                                    >
                                        {cat.title}
                                        <span style={{ color: C.muted, fontWeight: 400 }}>{cat.products?.length ?? ''}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <div className="font-bold text-lg mb-2.5" style={{ color: C.ink }}>Availability</div>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { label: 'All', on: !inStockOnly, click: () => updateFilters({ inStock: undefined }) },
                                { label: 'In stock only', on: inStockOnly, click: () => updateFilters({ inStock: 'true' }) },
                            ].map((o) => (
                                <button
                                    key={o.label}
                                    onClick={o.click}
                                    className="rounded-full px-4 py-1.5 text-sm font-semibold border"
                                    style={{
                                        borderColor: o.on ? C.teal : C.line,
                                        background: o.on ? C.teal : 'transparent',
                                        color: o.on ? '#fff' : C.muted,
                                    }}
                                >
                                    {o.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl p-5" style={{ background: C.tealD, color: '#fff' }}>
                        <div className="font-serif" style={{ fontSize: 22, lineHeight: 1.15 }}>Not sure what to buy?</div>
                        <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.45, margin: '8px 0 12px' }}>
                            Answer a few questions and get a product match.
                        </p>
                        <Link
                            href="/product-finder"
                            className="block text-center font-semibold rounded-full py-2.5 text-[15px]"
                            style={{ background: '#fff', color: C.tealD }}
                        >
                            Start the finder →
                        </Link>
                    </div>
                </aside>

                {/* Results */}
                <div>
                    <div className="flex justify-between items-center gap-4 mb-5 flex-wrap">
                        <div className="text-[16px]" style={{ color: C.muted }}>
                            {textSearch ? `Search results for "${textSearch}" — ` : ''}
                            {products.length}{totalPage > 1 && !loading ? '+' : ''} product{products.length === 1 ? '' : 's'}
                        </div>
                        <div className="flex gap-2 items-center flex-wrap">
                            <span className="text-sm" style={{ color: C.muted }}>Sort</span>
                            {SORTS.map((s) => {
                                const on = activeSort.value === s.value;
                                return (
                                    <button
                                        key={s.value}
                                        onClick={() => updateFilters({ sort: s.value })}
                                        className="rounded-full px-3.5 py-1.5 text-sm font-semibold border"
                                        style={{
                                            borderColor: on ? C.tealD : C.line,
                                            background: on ? C.tealD : 'transparent',
                                            color: on ? '#fff' : C.muted,
                                        }}
                                    >
                                        {s.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <InfiniteScroll
                        dataLength={products.length}
                        next={handleFetchMore}
                        hasMore={hasMore}
                        loader={<div className="text-center py-4" style={{ color: C.muted }}>Loading more products…</div>}
                        endMessage={products.length > 0 ? <div className="text-center py-4" style={{ color: C.muted }}>No more products</div> : null}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {loading && page === 1
                                ? loadingArrayCard.map((_, idx) => (
                                    <div key={idx} className="rounded-[18px] overflow-hidden animate-pulse bg-white border" style={{ borderColor: C.line }}>
                                        <div className="h-47.5" style={{ background: C.sage }} />
                                        <div className="p-5 flex flex-col gap-2.5">
                                            <div className="h-4 rounded w-1/2" style={{ background: C.sage }} />
                                            <div className="h-5 rounded w-3/4" style={{ background: C.sage }} />
                                            <div className="h-4 rounded w-1/3" style={{ background: C.sage }} />
                                        </div>
                                    </div>
                                ))
                                : products.map((product) => {
                                    const url = `/product/${validURLConvert(product.title)}_${product.id}`;
                                    const discount = Number(product.discount ?? 0);
                                    const finalPrice = PriceWithDiscount(product.price, discount);
                                    const hasDiscount = discount > 0;
                                    return (
                                        <div
                                            key={product.id}
                                            className="flex flex-col bg-white rounded-[18px] overflow-hidden border transition-transform hover:-translate-y-1 hover:shadow-xl"
                                            style={{ borderColor: C.line }}
                                        >
                                            <button
                                                onClick={() => router.push(url)}
                                                aria-label={`View ${product.title}`}
                                                className="w-full h-47.5 relative flex items-center justify-center overflow-hidden bg-white border-b"
                                                style={{ borderColor: C.line, padding: 0 }}
                                            >
                                                <img
                                                    src={product.images?.[0]}
                                                    alt={product.title}
                                                    className="max-w-[86%] max-h-[88%] object-contain"
                                                />
                                                {(hasDiscount || product.isFeatured) && (
                                                    <span
                                                        className="absolute top-3 left-3 text-white text-xs font-semibold rounded-full px-3 py-1"
                                                        style={{ background: hasDiscount ? C.accent : C.tealD }}
                                                    >
                                                        {hasDiscount ? `Save ${discount}%` : 'Bestseller'}
                                                    </span>
                                                )}
                                                <span
                                                    className="absolute bottom-2.5 right-3 text-xs font-semibold rounded-full px-3 py-1"
                                                    style={{ background: 'rgba(255,255,255,.94)', color: C.tealD }}
                                                >
                                                    View details →
                                                </span>
                                            </button>
                                            <div className="p-5 flex flex-col flex-1">
                                                {product.category?.title && (
                                                    <span
                                                        className="self-start font-semibold rounded-full px-3 py-1 text-sm"
                                                        style={{ background: C.sage, color: C.tealD }}
                                                    >
                                                        {product.category.title}
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => router.push(url)}
                                                    className="text-left font-serif block"
                                                    style={{ fontSize: 20, margin: '10px 0 4px', lineHeight: 1.15, color: C.ink }}
                                                >
                                                    {product.title}
                                                </button>
                                                {product.stock === 0 && (
                                                    <span className="text-sm font-semibold" style={{ color: '#b3452f' }}>Out of stock</span>
                                                )}
                                                <div className="flex justify-between items-end mt-auto pt-3">
                                                    <div>
                                                        <b style={{ fontSize: 21 }}>{DisplayPriceInAud(finalPrice)}</b>
                                                        {hasDiscount && (
                                                            <div className="text-sm line-through" style={{ color: C.muted }}>
                                                                {DisplayPriceInAud(Number(product.price ?? 0))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <AddToCartButton data={product} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </InfiniteScroll>

                    {!loading && products.length === 0 && (
                        <div className="text-center py-16 px-5" style={{ color: C.muted }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>◌</div>
                            <div className="font-serif" style={{ fontSize: 24, color: C.ink, marginBottom: 6 }}>
                                Nothing matches those filters
                            </div>
                            <div style={{ fontSize: 17 }}>Try clearing your filters, or ask our assistant.</div>
                            <button
                                onClick={clearFilters}
                                className="mt-5 rounded-full px-7 py-3 font-semibold text-white"
                                style={{ background: C.teal, fontSize: 16 }}
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

const ProductsPage = () => {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader /></div>}>
            <ProductsContent />
        </Suspense>
    );
};

export default ProductsPage;
