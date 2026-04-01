export const GLOBAL_POSITIVE_PROMPT = [
  "Create a stylized toy-like 3D character image from the reference person.",
  "Preserve facial identity with high fidelity: same face shape, eye shape and spacing, nose structure, lip shape, jawline, cheek structure, skin tone, and overall expression.",
  "Do not change age, gender, or ethnicity.",
  "Keep the face clearly recognizable from the input photo.",
  "Character must face straight toward the camera in a front view.",
  "Use a plain solid single-color background only (no gradients, patterns, scenery, or environment details).",
  "Use clean, high-detail, studio-quality rendering, balanced lighting, and sharp focus.",
].join(" ");

export const GLOBAL_NEGATIVE_PROMPT = [
  "different person",
  "face swap",
  "identity drift",
  "altered facial proportions",
  "asymmetrical face",
  "extra eyes",
  "distorted eyes",
  "bad anatomy",
  "blurry face",
  "low detail",
  "over-smoothed skin",
  "duplicate face",
  "artifacts",
  "watermark",
  "text",
  "logo",
  "cropped face",
  "out of frame",
].join(", ");

export const CHARACTER_NAME_VARIATIONS: Record<string, string[]> = {
  "elsa": ["elsa", "elsa - frozen"],
  "anna": ["anna", "anna- frozen"],
  "ariel": ["ariel", "little mermaid"],
  "belle": ["belle", "belle - beauty and the beast"],
};

export const normalizeCharacterName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/\s*-\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const applyNameVariations = (promptMap: Map<string, string>): void => {
  Object.entries(CHARACTER_NAME_VARIATIONS).forEach(([baseName, variations]) => {
    const prompt = promptMap.get(baseName) || promptMap.get(variations[0]);
    if (prompt) {
      variations.forEach((variation) => {
        if (!promptMap.has(variation)) {
          promptMap.set(variation, prompt);
        }
      });
    }
  });
};

export const resolveCharacterPrompt = (
  promptMap: Map<string, string>,
  characterName: string
): string | undefined => {
  let prompt = promptMap.get(characterName.toLowerCase());
  if (!prompt) {
    prompt = promptMap.get(normalizeCharacterName(characterName));
  }
  if (!prompt) {
    const lowerName = characterName.toLowerCase();
    for (const [base, variations] of Object.entries(CHARACTER_NAME_VARIATIONS)) {
      if (variations.includes(lowerName) || lowerName === base) {
        for (const variation of variations) {
          prompt = promptMap.get(variation);
          if (prompt) break;
        }
        if (prompt) break;
      }
    }
  }
  return prompt;
};

export const getCharacterSpecificNegative = (characterName: string): string => {
  const normalized = normalizeCharacterName(characterName);
  if (normalized.includes("astronaut")) {
    return "no fairy wings, no medieval armor";
  }
  if (normalized.includes("fairy")) {
    return "no space suit, no heavy combat armor";
  }
  if (normalized.includes("knight")) {
    return "no fairy wings, no modern sci-fi helmet";
  }
  if (normalized.includes("superhero")) {
    return "no medieval armor, no fantasy wand";
  }
  return "";
};

export const buildCombinedPositivePrompt = (characterName: string, characterPrompt: string): string =>
  `${GLOBAL_POSITIVE_PROMPT}\n\nCharacter style: ${characterName}.\n${characterPrompt}`.trim();

export const buildCombinedNegativePrompt = (characterName: string): string => {
  const characterNegative = getCharacterSpecificNegative(characterName);
  return characterNegative
    ? `${GLOBAL_NEGATIVE_PROMPT}, ${characterNegative}`
    : GLOBAL_NEGATIVE_PROMPT;
};
