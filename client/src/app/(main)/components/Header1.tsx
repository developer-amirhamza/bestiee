"use client"
import Image from 'next/image'
import React, { useEffect, useState, useRef } from 'react'
import { IoCall } from 'react-icons/io5'
import { MdVerified } from 'react-icons/md'
import { FaArrowRight, FaTruck } from 'react-icons/fa'
import { FaSearch, FaArrowLeft } from 'react-icons/fa'
import logo from "@/assets/header-logosr.png"
import { BsCart4 } from 'react-icons/bs'
import { GoTriangleDown, GoTriangleUp } from 'react-icons/go'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/redux/store'
import { fetchCart } from '@/redux/slices/cartSlice'
import { fetchUser } from '@/redux/slices/userSlices'
import { DisplayPriceInAud } from '@/utils/DisplayPriceInAud'
import CartMenu from './CartMenu'
import Search from './Search'
import Link from 'next/link'
import UserMenu from './UI/UserMenu';
import { motion, AnimatePresence } from 'framer-motion';
import AutoScrollSlider from './AutoScrollSlider'

const NAV_LINKS = [
    { label: 'Shop', href: '/products' },
    // { label: 'NDIS Support', href: '/ndis-support' },
    // { label: 'Brands', href: '/brands' },
    { label: 'Care Guides', href: '/blog' },
    { label: 'Contact', href: '/contact-us' },
]

const Header1 = () => {
    const dispatch = useDispatch<AppDispatch>()
    const { cart, status } = useSelector((state: RootState) => state.cartSlice)
    const user = useSelector((state: RootState) => state.userSlice)
    const router = useRouter()

    const [openCartMenu, setOpenCartMenu] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [topbarVisible, setTopbarVisible] = useState(true)
    const [searchOpen, setSearchOpen] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)

    useEffect(()=>{
        const handleScroll = ()=>{
            if(window.scrollY === 0){
                setTopbarVisible(true)
            }else{
                setTopbarVisible(false)
            }
        }
        window.addEventListener("scroll", handleScroll)
        return ()=>{
            window.removeEventListener("scroll", handleScroll)
        }
    },[])


    // useEffect(() => {
    //     const handleScroll = () => {
    //         const currentY = window.scrollY
    //         if(currentY === 0){
    //             setTopbarVisible(true)
    //         }else{setTopbarVisible(false)}
    //         // setTopbarVisible(currentY <= 20 || currentY < lastScrollY.current)
    //         // lastScrollY.current = currentY
    //     }
    //     window.addEventListener('scroll', handleScroll, { passive: true })
    //     return () => window.removeEventListener('scroll', handleScroll)
    // }, [])

    useEffect(() => {
        if (status === 'idle') dispatch(fetchCart())
    }, [status, dispatch])

    useEffect(() => {
        // Read localStorage live rather than from state — `user.status` is
        // reset to "idle" on sign-out too, and a stale token value captured
        // once at mount would otherwise re-fire fetchUser() right after
        // sign-out clears it, surfacing a spurious "token missing" toast.
        const token = localStorage.getItem('accessToken')
        if (token && user.status === 'idle') {
            dispatch(fetchUser())
        }
    }, [user.status, dispatch])

    const subtotal = cart?.items?.reduce(
        (sum, item) => sum + item.product.price * item.quantity, 0
    ) ?? 0

    const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0

    return (
        <div className="sticky top-0 gap-3 mb-8 z-50 ">

            <div
                className={`bg-secondary text-background transition-all duration-300 overflow-hidden top-bar
                    ${topbarVisible ? " max-h-10 opacity-100" : " max-h-0 opacity-0"} `}
            >
            <AutoScrollSlider speed={30} gap={50}
            className="container mx-auto flex items-center w-full overflow-x-hidden justify-between px-4 h-7 text-sm"
            >
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <FaTruck className="text-primary shrink-0" />
                        <span className="font-medium">Free, discreet shipping Australia-wide on orders over $99</span>
                    </div>
                        <a href="tel:1300243253" className="flex whitespace-nowrap items-center gap-1.5 hover:text-primary transition-colors">
                            <IoCall />
                            <span className="font-semibold">1300 243 253</span>
                        </a>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <MdVerified className="text-primary" />
                            <span>Registered NDIS provider</span>
                        </div>
            </AutoScrollSlider>

            </div>

            {/* Main navbar */}
            <div className="bg-background/20 w-full  backdrop-blur-xl shadow-xl  border-b border-primary-hover">
                <div className=" mx-auto w-full flex items-center justify-center gap-4 px-4 h-16">



                    {/* Nav links */}
                    <nav className="hidden lg:flex items-center justify-start  gap-1 ">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="px-3 py-2 text-sm font-medium text-text hover:text-text-hover hover:bg-background rounded-md transition-colors whitespace-nowrap"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Logo */}
                    <Link href="/" className="shrink-0 flex-1 justify-end flex items-center">
                        <Image
                            src={logo}
                            alt="Health U Shop"
                            className="h-13 w-auto object-contain"
                            priority
                        />
                    </Link>

                    {/* Search area */}
                    <div className="hidden lg:flex flex-1 justify-end" ref={searchRef}>
                        <AnimatePresence mode="wait">
                            {searchOpen ? (
                                <motion.div
                                    key="search-box"
                                    initial={{ opacity: 0, width: 120 }}
                                    animate={{ opacity: 1, width: '100%' }}
                                    exit={{ opacity: 0, width: 120 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    className="flex items-center gap-2 w-full"
                                >
                                    <button onClick={() => setSearchOpen(false)}
                                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 shrink-0 transition-colors"
                                        aria-label="Close search">
                                        {!searchOpen ? <FaArrowLeft size={16} /> : <FaArrowRight size={16} /> }
                                    </button>
                                    <div className="flex-1"><Search /></div>
                                </motion.div>
                            ) : (
                                <motion.button
                                    key="search-icon"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    onClick={() => setSearchOpen(true)}
                                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                                    aria-label="Open search">
                                    <FaSearch size={18} />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Search
                    <div className="hidden lg:flex flex-1 items-self-center max-w-full mx-1">
                        <Search />
                    </div> */}

                    {/* Right actions */}
                    <div className="flex items-center gap-2 ml-auto shrink-0">

                        {/* Free Samples */}
                        {/* <Link
                            href="/free-samples"
                            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-secondary hover:bg-secondary-hover  text-background text-sm font-medium rounded-full transition-colors whitespace-nowrap"
                        >
                            Free Samples
                        </Link> */}

                        {/* Account */}
                        {user.status === 'succeeded' && user.user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-text hover:bg-primary rounded-md transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {/* <span className="hidden sm:inline">Account</span> */}
                                    {showUserMenu ? <GoTriangleUp size={14} /> : <GoTriangleDown size={14} />}
                                </button>
                                {showUserMenu && (
                                    <div className="absolute top-11 right-0 bg-background  shadow-lg w-44 rounded-lg border border-primary z-50">
                                        <UserMenu close={() => setShowUserMenu(false)} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => router.push('/signin')}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {/* <span className="hidden sm:inline">Sign in</span> */}
                            </button>
                        )}

                        {/* Cart */}
                        <button
                            onClick={() => setOpenCartMenu(true)}
                            className="relative flex items-center gap-2 bg-secondary cursor-pointer hover:bg-secondary-hover  text-background px-3 py-2 rounded-lg transition-colors"
                        >
                            <BsCart4 size={20} className='animate-bounce ' />
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                            <span className="hidden sm:inline text-sm font-medium">
                                {cart?.items?.[0] ? DisplayPriceInAud(subtotal) : 'My Cart'}
                            </span>
                        </button>
                    </div>
                </div>
                {/* Mobile search */}
                <div className="lg:hidden px-4 pb-3">
                    <Search />
                </div>
            </div>
            {openCartMenu && <CartMenu close={() => setOpenCartMenu(false)} />}
        </div>
    )
}

export default Header1