import type { MetadataRoute } from "next";
import { getCategories, getProducts, getServices, getUseCases, getBlogPosts } from "@/lib/data";
import { connectDB } from "@/lib/db";
import { Product, Category, Service, UseCase, BlogPost } from "@/lib/models";
import { getSiteUrl } from "@/lib/seo";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await getSiteUrl();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${base}`,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${base}/products`,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${base}/services`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/use-cases`,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${base}/blog`,
      changeFrequency: "daily",
      priority: 0.75,
    },
    {
      url: `${base}/catalogue`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${base}/user-manual`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${base}/about`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/contact`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  try {
    const [products, categories, services, useCases, blogPosts] = await Promise.all([
      getProductSlugs(),
      getCategorySlugs(),
      getServiceSlugs(),
      getUseCaseSlugs(),
      getBlogPostSlugs(),
    ]);

    const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${base}/products/${encodeURIComponent(p.slug)}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${base}/products?category=${encodeURIComponent(c.slug)}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    }));

    const serviceEntries: MetadataRoute.Sitemap = services.map((s) => ({
      url: `${base}/services/${encodeURIComponent(s.slug)}`,
      lastModified: s.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    }));

    const useCaseEntries: MetadataRoute.Sitemap = useCases.map((u) => ({
      url: `${base}/use-cases/${encodeURIComponent(u.slug)}`,
      lastModified: u.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    const blogEntries: MetadataRoute.Sitemap = blogPosts.map((b) => ({
      url: `${base}/blog/${encodeURIComponent(b.slug)}`,
      lastModified: b.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [
      ...staticEntries,
      ...categoryEntries,
      ...productEntries,
      ...serviceEntries,
      ...useCaseEntries,
      ...blogEntries,
    ];
  } catch (err) {
    console.error("Error generating dynamic sitemap:", err);
    return staticEntries;
  }
}

async function getProductSlugs(): Promise<Array<{ slug: string; updatedAt?: Date }>> {
  try {
    const db = await connectDB();
    if (!db) {
      const fallback = await getProducts();
      return fallback.map((p) => ({ slug: p.slug }));
    }
    const docs = await Product.find({ published: { $ne: false } })
      .select("slug updatedAt")
      .sort({ updatedAt: -1 })
      .lean<Array<{ slug: string; updatedAt?: Date }>>();
    return docs.map((d) => ({ slug: d.slug, updatedAt: d.updatedAt }));
  } catch {
    const fallback = await getProducts();
    return fallback.map((p) => ({ slug: p.slug }));
  }
}

async function getCategorySlugs(): Promise<Array<{ slug: string; updatedAt?: Date }>> {
  try {
    const db = await connectDB();
    if (!db) {
      const fallback = await getCategories("product");
      return fallback.map((c) => ({ slug: c.slug }));
    }
    const docs = await Category.find({ type: "product" })
      .select("slug updatedAt")
      .lean<Array<{ slug: string; updatedAt?: Date }>>();
    return docs.map((d) => ({ slug: d.slug, updatedAt: d.updatedAt }));
  } catch {
    const fallback = await getCategories("product");
    return fallback.map((c) => ({ slug: c.slug }));
  }
}

async function getServiceSlugs(): Promise<Array<{ slug: string; updatedAt?: Date }>> {
  try {
    const db = await connectDB();
    if (!db) {
      const fallback = await getServices();
      return fallback.map((s) => ({ slug: s.slug }));
    }
    const docs = await Service.find({ published: { $ne: false } })
      .select("slug updatedAt")
      .lean<Array<{ slug: string; updatedAt?: Date }>>();
    return docs.map((d) => ({ slug: d.slug, updatedAt: d.updatedAt }));
  } catch {
    const fallback = await getServices();
    return fallback.map((s) => ({ slug: s.slug }));
  }
}

async function getUseCaseSlugs(): Promise<Array<{ slug: string; updatedAt?: Date }>> {
  try {
    const db = await connectDB();
    if (!db) {
      const fallback = await getUseCases();
      return fallback.map((u) => ({ slug: u.slug }));
    }
    const docs = await UseCase.find({ published: true })
      .select("slug updatedAt")
      .lean<Array<{ slug: string; updatedAt?: Date }>>();
    return docs.map((d) => ({ slug: d.slug, updatedAt: d.updatedAt }));
  } catch {
    const fallback = await getUseCases();
    return fallback.map((u) => ({ slug: u.slug }));
  }
}

async function getBlogPostSlugs(): Promise<Array<{ slug: string; updatedAt?: Date }>> {
  try {
    const db = await connectDB();
    if (!db) {
      const fallback = await getBlogPosts();
      return fallback.map((b) => ({ slug: b.slug }));
    }
    const docs = await BlogPost.find({ status: "published" })
      .select("slug updatedAt")
      .lean<Array<{ slug: string; updatedAt?: Date }>>();
    return docs.map((d) => ({ slug: d.slug, updatedAt: d.updatedAt }));
  } catch {
    const fallback = await getBlogPosts();
    return fallback.map((b) => ({ slug: b.slug }));
  }
}
