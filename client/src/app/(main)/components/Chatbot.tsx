"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RiChat3Fill, RiCloseFill, RiSendPlaneFill } from "react-icons/ri";
import { BsChevronDown } from "react-icons/bs";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";
import { DisplayPriceInAud } from "@/utils/DisplayPriceInAud";
import { PriceWithDiscount } from "@/utils/PriceWithDiscount";
import { validURLConvert } from "@/utils/validURLConvart";
import { RootState } from "@/redux/store";
import { normaliseRole, portalPath, ROLES } from "@/utils/roles";
import {
    CHANGE_OPTS,
    FINDER_QUESTIONS,
    FinderProduct,
    calcCost,
    matchFinderProducts,
    pickCalcTiles,
} from "./productFinderLogic";

type Sender = "bot" | "user";

interface ResultProduct {
    id: string;
    title: string;
    price: number;
    images: string[];
}

const toResultProduct = (p: FinderProduct): ResultProduct => ({
    id: p.id,
    title: p.title,
    price: PriceWithDiscount(p.price, p.discount),
    images: p.images,
});

// Quick replies are either a direct nav link (routes straight to a page),
// a named action handled in handleQuickReply, or an onClick — used for the
// dynamically generated steps of the Product & Cost assistant flow below.
interface QuickReply {
    label: string;
    action?: string;
    href?: string;
    onClick?: () => void;
}

interface Message {
    id: number;
    sender: Sender;
    text?: string;
    quickReplies?: QuickReply[];
    products?: ResultProduct[];
}

const ACTION_REPLIES: QuickReply[] = [
    { label: "Find Product & Cost", action: "product-cost" },
    { label: "Shipping info", action: "shipping-info" },
    { label: "Talk to a human", action: "talk-human" },
];

let idSeq = 1;

const Chatbot = () => {
    const [open, setOpen] = useState(false);
    const [minimised, setMinimised] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [searching, setSearching] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Loaded once the chat opens, and read via the ref (not the state
    // closure) from the Product & Cost assistant's flow functions below, so
    // they always see the latest products even though they're defined once.
    const [allProducts, setAllProducts] = useState<FinderProduct[]>([]);
    const allProductsRef = useRef<FinderProduct[]>([]);
    useEffect(() => {
        allProductsRef.current = allProducts;
    }, [allProducts]);

    useEffect(() => {
        if (open && allProductsRef.current.length === 0) {
            Axios({ ...SummeryApi.fetchProducts })
                .then((res) => setAllProducts(res.data?.data ?? res.data ?? []))
                .catch(() => {});
        }
    }, [open]);

    const user = useSelector((state: RootState) => state.userSlice?.user);
    const isLoggedIn = !!user;
    const role = normaliseRole(user?.role);

    // Nav quick replies are computed from login state / role so the bot only
    // offers links the visitor can actually use.
    const navReplies: QuickReply[] = [
        ...(isLoggedIn ? [{ label: "Track my order", href: "/order/my-orders" }] : []),
        { label: "Fit Finder", href: "/size-guide" },
        ...(isLoggedIn
            ? [{ label: "My Portal", href: portalPath(role) }]
            : [{ label: "User Portal", href: "/signin" }]),
        ...(isLoggedIn && role === ROLES.NDIS_COORDINATOR
            ? [{ label: "Get a Quote", href: "/portal/ndis" }]
            : [{ label: "Get a Quote", href: "/apply/ndis" }]),
    ];

    const QUICK_REPLIES: QuickReply[] = [...navReplies, ...ACTION_REPLIES];

    useEffect(() => {
        if (open && messages.length === 0) {
            setMessages([
                {
                    id: idSeq++,
                    sender: "bot",
                    text: "Hi! It's Bestiee, your virtual assistant at Health U Shop.",
                },
                {
                    id: idSeq++,
                    sender: "bot",
                    text: "I can help you find products, check stock, or point you to your orders.",
                },
                {
                    id: idSeq++,
                    sender: "bot",
                    text: "How can I help you?",
                    quickReplies: QUICK_REPLIES,
                },
            ]);
        }
    }, [open, messages.length]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, open]);

    const pushBot = (msg: Omit<Message, "id" | "sender">) => {
        setMessages((prev) => [...prev, { id: idSeq++, sender: "bot", ...msg }]);
    };

    const pushUser = (text: string) => {
        setMessages((prev) => [...prev, { id: idSeq++, sender: "user", text }]);
    };

    const runProductSearch = async (query: string) => {
        pushUser(query);
        setSearching(true);
        try {
            const response = await Axios({
                ...SummeryApi.searchProduct,
                params: { q: query, page: 1, limit: 5 },
            });
            const products: ResultProduct[] = response.data?.data || [];
            if (products.length === 0) {
                pushBot({
                    text: `I couldn't find anything for "${query}". Try a different keyword, or browse our shop.`,
                    quickReplies: QUICK_REPLIES,
                });
            } else {
                pushBot({ text: `Here's what I found for "${query}":`, products });
                pushBot({ text: "Need anything else?", quickReplies: QUICK_REPLIES });
            }
        } catch {
            pushBot({
                text: "Sorry, I couldn't reach the shop right now — please try again shortly.",
                quickReplies: QUICK_REPLIES,
            });
        } finally {
            setSearching(false);
        }
    };

    // Product & Cost assistant: a guided alternative to free-text search,
    // reusing the same matching/pricing logic as the homepage Product
    // Finder & Cost Calculator section so the two never give different
    // answers to the same questions.
    const startFinder = () => askFinderStep(0, {});

    const askFinderStep = (step: number, answers: Record<string, string>) => {
        const q = FINDER_QUESTIONS[step];
        pushBot({
            text: q.title,
            quickReplies: q.options.map((option) => ({
                label: option,
                onClick: () => {
                    const updated = { ...answers, [q.id]: option };
                    const next = step + 1;
                    if (next < FINDER_QUESTIONS.length) {
                        askFinderStep(next, updated);
                    } else {
                        showFinderResult(updated);
                    }
                },
            })),
        });
    };

    const showFinderResult = (answers: Record<string, string>) => {
        const results = matchFinderProducts(allProductsRef.current, answers);
        pushBot({
            text: results.length > 0
                ? "Based on your answers, here's what we'd suggest:"
                : "I couldn't find a close match — here's our range instead.",
            products: results.map(toResultProduct),
        });
        pushBot({
            text: "Want to see what that would cost you? Most of our range is also NDIS, Support at Home and CAPS claimable.",
            quickReplies: [
                { label: "Work out my cost", onClick: startCalc },
                { label: "Start over", onClick: restartAssistant },
            ],
        });
    };

    const startCalc = () => {
        const tiles = pickCalcTiles(allProductsRef.current);
        if (tiles.length === 0) {
            pushBot({ text: "We don't have any products loaded to cost right now — please try again shortly." });
            return;
        }
        pushBot({
            text: "Which product are you costing?",
            quickReplies: tiles.map((p) => ({
                label: p.title,
                onClick: () => askChanges(p),
            })),
        });
    };

    const askChanges = (product: FinderProduct) => {
        pushBot({
            text: `How many changes a day, for ${product.title}?`,
            quickReplies: CHANGE_OPTS.map((o, i) => ({
                label: o.label,
                onClick: () => showCalcResult(product, i),
            })),
        });
    };

    const showCalcResult = (product: FinderProduct, changeIndex: number) => {
        const { unit, weekly, monthly, yearly, packsAMonth } = calcCost(
            product,
            changeIndex,
            PriceWithDiscount(product.price, product.discount)
        );
        pushBot({
            text:
                `${DisplayPriceInAud(unit)} each, about ${packsAMonth} pack${packsAMonth === 1 ? "" : "s"} a month.\n\n` +
                `Estimated cost — Weekly: ${DisplayPriceInAud(weekly)} · Monthly: ${DisplayPriceInAud(monthly)} · Yearly: ${DisplayPriceInAud(yearly)}.\n\n` +
                `This is an estimate, not a quote. CAPS can pay up to $739.40 a year toward continence products — we can help you check eligibility.`,
            products: [toResultProduct(product)],
        });
        pushBot({
            text: "Anything else?",
            quickReplies: [
                { label: "Find the right product", onClick: startFinder },
                { label: "Get an exact quote", href: "/apply/ndis" },
                { label: "Start over", onClick: restartAssistant },
            ],
        });
    };

    const restartAssistant = () => {
        pushBot({
            text: "Sure — would you like to find the right product, or work out the cost?",
            quickReplies: [
                { label: "Find the right product", onClick: startFinder },
                { label: "Work out my cost", onClick: startCalc },
            ],
        });
    };

    const handleQuickReply = (reply: QuickReply) => {
        pushUser(reply.label);
        if (reply.onClick) {
            reply.onClick();
            return;
        }
        if (reply.action === "product-cost") {
            pushBot({
                text: "I can find the right product for you, or work out what it will cost. Which would you like?",
                quickReplies: [
                    { label: "Find the right product", onClick: startFinder },
                    { label: "Work out my cost", onClick: startCalc },
                ],
            });
            return;
        }
        if (reply.action === "shipping-info") {
            pushBot({
                text: "We offer free, discreet shipping Australia-wide on orders over $99. Standard delivery is 2-5 business days.",
                quickReplies: QUICK_REPLIES,
            });
            return;
        }
        if (reply.action === "talk-human") {
            pushBot({
                text: "No problem — you can reach our team via the Contact page, or call 1300 243 253.",
                quickReplies: QUICK_REPLIES,
            });
            return;
        }
    };

    const handleSend = () => {
        const text = input.trim();
        if (!text) return;
        setInput("");
        runProductSearch(text);
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                aria-label="Chat with Bestiee"
                className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-secondary text-white shadow-lg hover:bg-secondary-hover transition-colors"
            >
                <RiChat3Fill size={26} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] max-w-sm flex flex-col rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
            {/* Header */}
            <div className="flex items-center justify-between bg-secondary text-white px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <RiChat3Fill size={16} />
                    </div>
                    <span className="font-semibold">Chat with Bestiee</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setMinimised((m) => !m)}
                        aria-label="Minimise"
                        className="hover:bg-white/10 rounded p-1 transition-colors"
                    >
                        <BsChevronDown size={16} className={`transition-transform ${minimised ? "rotate-180" : ""}`} />
                    </button>
                    <button
                        onClick={() => setOpen(false)}
                        aria-label="Close chat"
                        className="hover:bg-white/10 rounded p-1 transition-colors"
                    >
                        <RiCloseFill size={18} />
                    </button>
                </div>
            </div>

            {!minimised && (
                <>
                    {/* Messages */}
                    <div className="flex-1 max-h-[60vh] overflow-y-auto px-4 py-4 space-y-3 bg-[#f5f7fb]">
                        {messages.map((m) => (
                            <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                                <div className="max-w-[85%] flex flex-col gap-2">
                                    {m.text && (
                                        <div
                                            className={`rounded-2xl px-3.5 py-2 text-sm leading-snug whitespace-pre-line ${
                                                m.sender === "bot"
                                                    ? "bg-primary-hover text-text rounded-bl-sm"
                                                    : "bg-white border border-gray-200 text-gray-800 rounded-br-sm"
                                            }`}
                                        >
                                            {m.text}
                                        </div>
                                    )}

                                    {m.products && (
                                        <div className="flex flex-col gap-2">
                                            {m.products.map((p) => (
                                                <Link
                                                    key={p.id}
                                                    href={`/product/${validURLConvert(p.title)}_${p.id}`}
                                                    onClick={() => setOpen(false)}
                                                    className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2 hover:border-primary-hover transition-colors"
                                                >
                                                    {p.images?.[0] && (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={p.images[0]}
                                                            alt={p.title}
                                                            className="w-10 h-10 object-contain rounded shrink-0"
                                                        />
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium text-gray-800 truncate">{p.title}</p>
                                                        <p className="text-xs text-secondary font-semibold">{DisplayPriceInAud(p.price)}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {m.quickReplies && (
                                        <div className="grid grid-cols-2 gap-2">
                                            {m.quickReplies.map((r) =>
                                                r.href ? (
                                                    <Link
                                                        key={r.label}
                                                        href={r.href}
                                                        onClick={() => setOpen(false)}
                                                        className="text-center border border-secondary text-secondary text-xs font-medium rounded-md px-2 py-2 hover:bg-blue-50 transition-colors"
                                                    >
                                                        {r.label}
                                                    </Link>
                                                ) : (
                                                    <button
                                                        key={r.label}
                                                        onClick={() => handleQuickReply(r)}
                                                        className="border border-secondary text-secondary text-xs font-medium rounded-md px-2 py-2 hover:bg-blue-50 transition-colors"
                                                    >
                                                        {r.label}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {searching && (
                            <div className="flex justify-start">
                                <div className="rounded-2xl px-3.5 py-2 text-sm bg-primary-hover text-white rounded-bl-sm">
                                    Searching…
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="flex items-center gap-2 border-t border-gray-200 bg-white px-3 py-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="How can I help you?"
                            className="flex-1 text-sm outline-none px-2 py-2 bg-transparent text-gray-700 placeholder:text-gray-400"
                        />
                        <button
                            onClick={handleSend}
                            aria-label="Send"
                            className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary text-white hover:bg-secondary transition-colors shrink-0"
                        >
                            <RiSendPlaneFill size={14} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Chatbot;
