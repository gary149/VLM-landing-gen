import { readFile } from "fs/promises";

const createFreeimageUploader = (apiKey: string) => {
  const apiUrl = "https://freeimage.host/api/1/upload";

  const uploadLocalImage = async (imagePath: string): Promise<string> => {
    try {
      const imageBuffer = await readFile(imagePath);
      const form = new FormData();
      form.append("key", apiKey);
      form.append("action", "upload");
      form.append(
        "source",
        new Blob([imageBuffer]),
        imagePath.split("/").pop()
      );
      form.append("format", "json");

      const response = await fetch(apiUrl, {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      return responseData.image.url;
    } catch (error) {
      console.error(
        "Error uploading image:",
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  };

  return { uploadLocalImage };
};

export default createFreeimageUploader;
