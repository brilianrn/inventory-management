const MAX_EDGE = 480;
const QUALITY = 0.5;

export const ACCEPTED_IMAGE_TYPES = 'image/*';

const loadImage = (dataUrl) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Berkas gambar tidak bisa dibaca'));
    image.src = dataUrl;
  });

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Berkas gambar tidak bisa dibaca'));
    reader.readAsDataURL(file);
  });

export const readResizedPhoto = async (file) => {
  const original = await readAsDataUrl(file);
  const image = await loadImage(original);

  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return { name: file.name, dataUrl: canvas.toDataURL('image/jpeg', QUALITY) };
};
