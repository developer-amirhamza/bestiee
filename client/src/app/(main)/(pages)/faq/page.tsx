"use client";
import { useEffect, useState } from "react";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";
import AxiosToastError from "@/utils/AxiosToastError";
import Loader from "@/app/(main)/components/UI/Loader";
import Breadcrumb from "@/app/(main)/components/UI/Breadcrumb";
import FaqAccordion, { FaqItem } from "@/app/(main)/components/UI/FaqAccordion";

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await Axios({ ...SummeryApi.getFaqs });
        if (res.data?.success) setFaqs(res.data.data);
      } catch (error) {
        AxiosToastError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  return (
    <section className="w-full bg-background py-14 lg:py-20">
      <div className="container mx-auto px-6 max-w-3xl">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "FAQ" }]} />

        <div className="text-center mt-6 mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary mb-3">
            Frequently asked questions
          </p>
          <h1 className="font-secondary text-3xl md:text-4xl text-text-hover mb-4">
            Got questions? We&apos;ve got answers
          </h1>
          <p className="text-text text-sm md:text-base leading-relaxed">
            Everything you need to know about bladder and bowel leakage, our products, and ordering with Bestiee.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : faqs.length === 0 ? (
          <p className="text-center text-text py-12">
            We&apos;re still putting this page together — in the meantime,{" "}
            <a href="/contact-us" className="text-secondary font-semibold underline underline-offset-2">
              get in touch
            </a>{" "}
            and we&apos;ll answer any question directly.
          </p>
        ) : (
          <FaqAccordion faqs={faqs} />
        )}
      </div>
    </section>
  );
}
