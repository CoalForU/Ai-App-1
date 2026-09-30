import type { IdentifiedItem } from "./types";
import { DEFAULT_ITEM } from "./pricing";

export async function identifyItemFromPhoto(
  imageDataUrl?: string | null,
): Promise<IdentifiedItem> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !imageDataUrl?.startsWith("data:image")) {
    return DEFAULT_ITEM;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Identify thrift/resale items from photos. Return JSON with keys: name, brand, category, condition, searchQuery.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Identify this item for marketplace pricing.",
              },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) return DEFAULT_ITEM;
    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return DEFAULT_ITEM;
    const parsed = JSON.parse(content) as Partial<IdentifiedItem>;
    return {
      id: `vision-${Date.now()}`,
      name: parsed.name || DEFAULT_ITEM.name,
      brand: parsed.brand || DEFAULT_ITEM.brand,
      category: parsed.category || DEFAULT_ITEM.category,
      condition: parsed.condition || DEFAULT_ITEM.condition,
      searchQuery: parsed.searchQuery || parsed.name || DEFAULT_ITEM.searchQuery,
    };
  } catch {
    return DEFAULT_ITEM;
  }
}
