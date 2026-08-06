"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Axios from '@/utils/Axios';
import AxiosToastError from '@/utils/AxiosToastError';
import { SummeryApi } from '@/app/common/SummeryApi';
import { DisplayPriceInAud } from '@/utils/DisplayPriceInAud';
import { PriceWithDiscount } from '@/utils/PriceWithDiscount';
import image1 from "@/assets/minute_delivery-Bu9utzxK.png";
import image2 from "@/assets/Best_Prices_Offers-CbMh73zQ.png";
import image3 from "@/assets/Wide_Assortment-CbRiDBkF.png";
import { FaAngleLeft, FaAngleRight, FaTrash, FaEdit } from "react-icons/fa";
import StarRating from '@/utils/StartRating';
import { fetchProductReviews, addReview, updateReview, deleteReview } from '@/redux/slices/reviewSlice';
import { RootState, AppDispatch } from '@/redux/store';
import AddToCartButton from '@/app/(main)/components/UI/AddToCartBtn';
import Divider from '@/app/(main)/components/UI/Divider';
import SizeFinder from '@/app/(main)/components/SizeFinder';

const ProductDetailsPage = () => {
    const params = useParams();
    const productSlug = params.product;
    const productId = (Array.isArray(productSlug) ? productSlug[0] : productSlug)?.split("_")?.slice(-1)[0];

    const [data, setData] = useState<any>({
        title: "",
        images: [],
        price: 0,
        discount: 0,
        description: "",
        more_details: {},
        stock: 0,
    });
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(0);
    const [rating, setRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [editRating, setEditRating] = useState(0);
    const [editComment, setEditComment] = useState("");

    const dispatch = useDispatch<AppDispatch>();
    const user = useSelector((state: RootState) => state.userSlice?.user);
    const { reviews, averageRating, totalReviews, status: reviewStatus } = useSelector((state: RootState) => state.reviewSlice);
    console.log(reviews,"reviews")
    // Fetch product details
    const fetchProductDetails = async (id: string) => {
        if (!id) return;
        try {
            setLoading(true);
            const response = await Axios({
                ...SummeryApi.fetchProductDetails,
                data: { id },
            });
            if (response.data?.success) {
                setData(response.data?.data);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch reviews when productId changes
    useEffect(() => {
        if (productId) {
            fetchProductDetails(productId);
            dispatch(fetchProductReviews(productId));
        }
    }, [productId, dispatch]);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
    }, []);

    // Helper for image scroll
    const handleScrollLeft = () => setImage(prev => prev > 0 ? prev - 1 : data.images?.length - 1);
    const handleScrollRight = () => setImage(prev => prev < data.images?.length - 1 ? prev + 1 : 0);

    // Submit new review
    const handleAddReview = async () => {
        if (!user) {
            toast.error("Please login to write a review");
            return;
        }
        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }
        if (!reviewComment.trim()) {
            toast.error("Please write a comment");
            return;
        }
        await dispatch(addReview({ productId: productId!, rating, comment: reviewComment }));
        setRating(0);
        setReviewComment("");
    };

    // Start editing a review
    const startEdit = (review: any) => {
        setEditingReviewId(review.id);
        setEditRating(review.rating);
        setEditComment(review.comment || "");
    };

    // Cancel editing
    const cancelEdit = () => {
        setEditingReviewId(null);
        setEditRating(0);
        setEditComment("");
    };

    // Submit edit
    const handleUpdateReview = async (reviewId: string) => {
        if (editRating === 0) {
            toast.error("Please select a rating");
            return;
        }
        if (!editComment.trim()) {
            toast.error("Please write a comment");
            return;
        }
        await dispatch(updateReview({ reviewId, rating: editRating, comment: editComment }));
        cancelEdit();
    };

    // Delete review
    const handleDeleteReview = async (reviewId: string) => {
        if (window.confirm("Are you sure you want to delete this review?")) {
            await dispatch(deleteReview(reviewId));
        }
    };

    if (loading) {
        return <div className="container mx-auto p-4">Loading...</div>;
    }

    return (
        <main className='bg-[#fffbeb] py-12' >
        <section className="container mx-auto p-4 grid lg:grid-cols-2 gap-6     ">
            {/* Left Column - Images */}
            <div>
                <div className="w-full h-56 lg:h-[65vh] bg-white rounded flex items-center justify-center">
                    <img className="h-full object-contain" src={data.images?.[image]} alt={data.title} />
                </div>
                <div className="flex justify-center gap-2 my-2">
                    {data.images?.map((_: any, idx: number) => (
                        <div key={idx} className={`w-2 h-2 rounded-full ${idx === image ? "bg-slate-600" : "bg-slate-300"}`} />
                    ))}
                </div>
                <div className="relative flex items-center">
                    <div className="flex overflow-x-auto gap-2 no-scrollbar my-4">
                        {data.images?.map((img: string, idx: number) => (
                            <div key={idx} onClick={() => setImage(idx)} className={`w-20 h-20 rounded-lg cursor-pointer ${idx === image ? "border-2 border-blue-500" : ""}`}>
                                <img src={img} className="w-full h-full object-cover rounded" alt={data.title} />
                            </div>
                        ))}
                    </div>
                    <button onClick={handleScrollLeft} className="absolute left-0 bg-white p-1 rounded-full shadow"><FaAngleLeft /></button>
                    <button onClick={handleScrollRight} className="absolute right-0 bg-white p-1 rounded-full shadow"><FaAngleRight /></button>
                </div>
                {/* Description */}
                {data.description && (
                    <div className="mt-4 lg:block hidden">
                        <h2 className="text-xl font-semibold">Description</h2>
                        <p>{data.description}</p>
                    </div>
                )}
            </div>

            {/* Right Column - Details */}
            <div className='pt-10 px-5'>
                {data.absorbency && (
                    <span className="inline-block bg-primary text-secondary text-xs font-semibold rounded-full px-3 py-1 mb-2">
                        {data.absorbency}
                    </span>
                )}
                <h1 className="text-2xl font-bold">{data.title}</h1>
                <div className="flex gap-2 items-center mt-2">
                    <StarRating rating={averageRating} />
                    <span className="text-sm text-orange-500">{averageRating} ({totalReviews} reviews)</span>
                </div>
                <div className="mt-4 flex items-center justify-star w-full gap-x-12">
                    <p className="text-2xl font-semibold">{DisplayPriceInAud(PriceWithDiscount(data.price, data.discount))}</p>
                    {data.discount > 0 && (
                        <p className="line-through text-neutral-500 text-2xl">{DisplayPriceInAud(data.price)}</p>
                    )}
                    {data.pack && (
                        <p className="text-sm text-neutral-500">{data.pack}</p>
                    )}
                </div>
                {data.pricingNotes && (
                    <p className="text-sm text-neutral-500 mt-1">{data.pricingNotes}</p>
                )}
                <div className="mt-4">
                    {data.stock === 0 ? (
                        <p className="text-red-500">Out of Stock</p>
                    ) : (
                        <AddToCartButton data={data} />
                    )}
                </div>
                                <div className="my-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm font-medium text-neutral-600">Size</span>
                        {/* Link to the Size guide tab below, plus the standalone page */}
                        <a href="#size-guide" className="text-sm font-semibold text-[#2f7d6f] hover:underline">
                            Find my size →
                        </a>
                    </div>
                    {data.sizes &&
                    <div className="flex gap-2 items-center flex-wrap">
                        {data.sizes?.map((size:any,index:number)=>(
                            <div key={index} className="flex  ">
                                <div className="text-sm font-medium border cursor-pointer hover:bg-gray-100 text-neutral-500 p-1 rounded">{size}</div> </div>
                        ))}
                    </div> }
                </div>
                <Divider />
                {data.description && (
                    <div className="mt-4 lg:hidden">
                        <h2 className="text-xl font-semibold">Description</h2>
                        <p>{data.description}</p>
                    </div>
                )}
                <Divider />


                {/* ========== SIZE GUIDE TAB ========== */}
                <div id="size-guide" className="mt-6 scroll-mt-24">
                    <SizeFinder product={data} />
                </div>
                <Divider />

                {data.keyFeatures?.length > 0 && (
                    <>
                        <div className="mt-4">
                            <h2 className="text-xl font-semibold mb-2">What makes it work</h2>
                            <ul className="flex flex-col gap-2">
                                {data.keyFeatures.map((feature: string, idx: number) => (
                                    <li key={idx} className="flex gap-2 text-neutral-600">
                                        <span className="text-secondary">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <Divider />
                    </>
                )}

                {/* ========== REVIEWS SECTION ========== */}

                {/* ========== REVIEWS SECTION ========== */}
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-3">Customer Reviews</h2>

                    {/* Add/Edit Review Form */}
                    {user ? (
                        <div className="bg-white p-4 rounded shadow mb-4">
                            <h3 className="font-medium mb-2">{editingReviewId ? "Edit Your Review" : "Write a Review"}</h3>
                            <div className="mb-2">
                                <StarRating
                                    rating={editingReviewId ? editRating : rating}
                                    handleRatingChange={editingReviewId ? setEditRating : setRating}
                                />
                            </div>
                            <textarea
                                rows={3}
                                className="w-full border rounded p-2 mb-2"
                                placeholder="Share your experience with this product..."
                                value={editingReviewId ? editComment : reviewComment}
                                onChange={(e) => editingReviewId ? setEditComment(e.target.value) : setReviewComment(e.target.value)}
                            />
                            <div className="flex gap-2">
                                {editingReviewId ? (
                                    <>
                                        <button onClick={() => handleUpdateReview(editingReviewId)} className="bg-blue-600 text-white px-3 py-1 rounded">Update</button>
                                        <button onClick={cancelEdit} className="bg-gray-300 px-3 py-1 rounded">Cancel</button>
                                    </>
                                ) : (
                                    <button onClick={handleAddReview} className="bg-green-600 text-white px-3 py-1 rounded">Submit Review</button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-neutral-500 mb-3">Please <a href="/signin" className="text-blue-600">login</a> to write a review.</p>
                    )}

                    {/* Reviews List */}
                    {reviewStatus === 'loading' && <p>Loading reviews...</p>}
                    {reviews.length === 0 && reviewStatus !== 'loading' && (
                        <p className="text-neutral-500">No reviews yet. Be the first to review!</p>
                    )}
                    <div className="space-y-4 mt-3">
                        {reviews.map((review) => (
                            <div key={review.id} className="border-b pb-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <StarRating rating={review.rating} />
                                            <span className="font-semibold">{review.user.name}</span>
                                        </div>
                                        <p className="text-sm text-neutral-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    {/* {user && (user?.id === review.userId || user?.role === 'ADMIN') && !editingReviewId && (
                                        <div className="flex gap-2">
                                            <button onClick={() => startEdit(review)} className="text-blue-600"><FaEdit /></button>
                                            <button onClick={() => handleDeleteReview(review.id)} className="text-red-600"><FaTrash /></button>
                                        </div>
                                    )} */}
                                </div>
                                <p className="mt-1 text-neutral-700">{review.comment}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
        </main>
    );
};

export default ProductDetailsPage;