export const getCroppedImg = (
  imageSrc: string,
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  }
): Promise<string> => {
  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous"); // CORS対応
      image.src = url;
    });

  return new Promise(async (resolve, reject) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return reject(new Error("Failed to get canvas context"));
    }

    // キャンバスのサイズをcropのサイズに設定
    canvas.width = crop.width;
    canvas.height = crop.height;

    if (
      !crop ||
      typeof crop.x !== "number" ||
      typeof crop.y !== "number" ||
      typeof crop.width !== "number" ||
      typeof crop.height !== "number"
    ) {
      return reject(new Error("Invalid crop parameters"));
    }

    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return reject(new Error("Canvas toBlob failed"));
        }
        const fileUrl = URL.createObjectURL(blob);
        resolve(fileUrl);
      },
      "image/jpeg",
      0.95
    );
  });
};

