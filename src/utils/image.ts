export function resizeImageToBase64(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const { width, height } = image;
        const ratio = Math.min(maxSize / width, maxSize / height, 1);
        const targetWidth = Math.round(width * ratio);
        const targetHeight = Math.round(height * ratio);

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Canvas context is not available."));
          return;
        }

        context.drawImage(image, 0, 0, targetWidth, targetHeight);

        const webpData = canvas.toDataURL("image/webp", 0.8);

        if (webpData.startsWith("data:image/webp")) {
          resolve(webpData);
          return;
        }

        const jpegData = canvas.toDataURL("image/jpeg", 0.8);
        resolve(jpegData);
      };

      image.onerror = () => reject(new Error("이미지를 읽을 수 없습니다."));
      image.src = reader.result as string;
    };

    reader.onerror = () => reject(new Error("파일을 읽을 수 없습니다."));
    reader.readAsDataURL(file);
  });
}
