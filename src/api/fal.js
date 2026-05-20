import { fal } from '@fal-ai/client'

fal.config({ credentials: import.meta.env.VITE_FAL_API_KEY })

export const FAL_IMAGE_MODEL = 'fal-ai/flux-pro/v1.1'
export const FAL_VIDEO_MODEL = 'fal-ai/wan/t2v-14b'

export async function generateSFWImage({ prompt, aspectRatio = '9:16', numImages = 1 }) {
  const result = await fal.subscribe(FAL_IMAGE_MODEL, {
    input: {
      prompt,
      num_images: numImages,
      aspect_ratio: aspectRatio,
      safety_tolerance: '2',
    },
  })
  return result.data.images.map(img => img.url)
}

export async function generateSFWVideo({ prompt, aspectRatio = '9:16' }) {
  const result = await fal.subscribe(FAL_VIDEO_MODEL, {
    input: {
      prompt,
      aspect_ratio: aspectRatio,
    },
  })
  return result.data.video.url
}
