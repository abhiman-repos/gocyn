import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = [
    "/admin/",
    "/instructors/dashboard/",
    "/instructors/auth/",
    "/profile/",
    "/course/*/checkout/",
    "/course/*/learn/",
    "/auth/",
    "/login/",
    "/register/",
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: privatePaths },
      // Explicitly permit ChatGPT search crawling while preserving private-route blocks.
      { userAgent: "OAI-SearchBot", allow: "/", disallow: privatePaths },
    ],
    sitemap: "https://www.gocyn.com/sitemap.xml",
  };
}
