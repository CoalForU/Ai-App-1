import type { ListingDraft, ScanResult } from "./types";

export async function generateListing(result: ScanResult): Promise<ListingDraft> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
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
                "Write marketplace listings. Return JSON with title, description, category. Title under 80 chars. Description 2-4 short paragraphs, no hashtag spam.",
            },
            {
              role: "user",
              content: JSON.stringify({
                name: result.name,
                brand: result.brand,
                category: result.category,
                condition: result.condition,
                listAt: result.listAt,
              }),
            },
          ],
        }),
      });
      if (response.ok) {
        const json = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content) as ListingDraft;
          if (parsed.title && parsed.description && parsed.category) {
            return parsed;
          }
        }
      }
    } catch {
      // fall through to template
    }
  }

  return templateListing(result);
}

function templateListing(result: ScanResult): ListingDraft {
  const title = `${result.brand} ${result.name.replace(result.brand, "").trim()} — ${result.condition.split("—")[0].trim()}`.slice(
    0,
    80,
  );

  const description = [
    `${result.name} in ${result.condition.toLowerCase()}.`,
    `Priced to move around $${result.listAt} based on recent ${result.sources.map((s) => s.label).join(", ")} comps.`,
    `Ships fast. Smoke-free home. Ask questions before buying — happy to send more photos.`,
  ].join("\n\n");

  return {
    title,
    description,
    category: result.category.split("·")[0].trim() || result.category,
  };
}
