"use client";
import React, { useEffect, useState } from "react";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";
import AxiosToastError from "@/utils/AxiosToastError";
import toast from "react-hot-toast";
import { FaTrash, FaEdit, FaPlus, FaTimes } from "react-icons/fa";

interface Faq {
    id: string;
    question: string;
    answer: string;
    blogId?: string | null;
    order: number;
    isActive: boolean;
}

interface BlogOption {
    id: string;
    title: string;
}

const emptyForm = { question: "", answer: "", blogId: "", order: 0 };

const AdminFaqsPage = () => {
    const [faqs, setFaqs] = useState<Faq[]>([]);
    const [blogs, setBlogs] = useState<BlogOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Faq | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

    const fetchFaqs = async () => {
        try {
            setLoading(true);
            const res = await Axios({ ...SummeryApi.getAllFaqsAdmin });
            if (res.data?.success) setFaqs(res.data.data || []);
        } catch (err) {
            AxiosToastError(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBlogs = async () => {
        try {
            const res = await Axios({ ...SummeryApi.getAllBlogs, params: { limit: 200 } });
            if (res.data?.success) setBlogs(res.data.data || []);
        } catch {
            /* the blog picker is a nice-to-have, not required to manage FAQs */
        }
    };

    useEffect(() => { fetchFaqs(); fetchBlogs(); }, []);

    const blogTitle = (blogId?: string | null) => blogs.find((b) => b.id === blogId)?.title;

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (f: Faq) => {
        setEditing(f);
        setForm({ question: f.question, answer: f.answer, blogId: f.blogId || "", order: f.order });
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditing(null); setForm(emptyForm); };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.question.trim() || !form.answer.trim()) {
            toast.error("Question and answer are required");
            return;
        }
        try {
            setSaving(true);
            const payload = { ...form, blogId: form.blogId || undefined };
            let res;
            if (editing) {
                res = await Axios({ ...SummeryApi.updateFaq, data: { id: editing.id, ...payload } });
            } else {
                res = await Axios({ ...SummeryApi.createFaq, data: payload });
            }
            if (res.data?.success) {
                toast.success(editing ? "FAQ updated" : "FAQ created");
                closeModal();
                fetchFaqs();
            } else {
                toast.error(res.data?.message || "Failed to save FAQ");
            }
        } catch (err) {
            AxiosToastError(err);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (f: Faq) => {
        try {
            const res = await Axios({ ...SummeryApi.updateFaq, data: { id: f.id, isActive: !f.isActive } });
            if (res.data?.success) {
                toast.success(f.isActive ? "FAQ hidden" : "FAQ shown");
                setFaqs((prev) => prev.map((x) => x.id === f.id ? { ...x, isActive: !x.isActive } : x));
            }
        } catch (err) {
            AxiosToastError(err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this FAQ?")) return;
        try {
            setDeleteLoading(id);
            const res = await Axios({ ...SummeryApi.deleteFaq, data: { id } });
            if (res.data?.success) {
                toast.success("Deleted");
                setFaqs((prev) => prev.filter((f) => f.id !== id));
            }
        } catch (err) {
            AxiosToastError(err);
        } finally {
            setDeleteLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4 flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">FAQs</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Standalone entries appear on the public /faq page. Attach one to an article to show it as that article&apos;s embedded FAQ section instead.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition"
                >
                    <FaPlus className="text-sm" /> Add FAQ
                </button>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shows on</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {faqs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No FAQs yet. Add your first one!
                                </td>
                            </tr>
                        ) : (
                            faqs.map((f, i) => (
                                <tr key={f.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                                    <td className="px-6 py-4 max-w-md">
                                        <p className="font-semibold text-gray-800 text-sm">{f.question}</p>
                                        <p className="text-xs text-gray-400 line-clamp-1">{f.answer}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {f.blogId ? (blogTitle(f.blogId) || "Article") : "FAQ page"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleActive(f)}
                                            className={`px-2 py-1 rounded-full text-xs font-semibold transition ${f.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                                        >
                                            {f.isActive ? "Active" : "Hidden"}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEdit(f)}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                            >
                                                <FaEdit className="text-xs" /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(f.id)}
                                                disabled={deleteLoading === f.id}
                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${deleteLoading === f.id ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                                            >
                                                <FaTrash className="text-xs" />
                                                {deleteLoading === f.id ? "..." : "Delete"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editing ? "Edit FAQ" : "Add FAQ"}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                                <input
                                    type="text"
                                    value={form.question}
                                    onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Is bladder leakage normal?"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Answer *</label>
                                <textarea
                                    value={form.answer}
                                    onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    placeholder="The answer shown to visitors"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Shows on</label>
                                    <select
                                        value={form.blogId}
                                        onChange={(e) => setForm((f) => ({ ...f, blogId: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">FAQ page (standalone)</option>
                                        {blogs.map((b) => (
                                            <option key={b.id} value={b.id}>{b.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                                    <input
                                        type="number"
                                        value={form.order}
                                        onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-60"
                                >
                                    {saving ? "Saving..." : editing ? "Save Changes" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFaqsPage;
